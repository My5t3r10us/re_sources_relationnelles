"use server";

import { db } from "@/db";
import { resource, user, comment, report, category, resourceFile } from "@/db/schema";
import { deleteObject, getObjectKeyFromUrl } from "@/lib/s3";
import { eq } from "drizzle-orm";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-server";
import { canAssignRole, canManageUser, manageDenialMessage } from "@/lib/authz";
import type { UserRole } from "@/lib/session-user";
import {
  categoryInputSchema,
  parseOrThrow,
  resourceStatusSchema,
  commentStatusSchema,
  adminUserCreateSchema,
} from "@/lib/validation";
import { revalidatePath } from "next/cache";

/**
 * Charge la cible d'une action de gestion de compte et vérifie que l'acteur a
 * le droit d'agir dessus.
 *
 * Sans ce contrôle, `requireAdmin()` autorisait l'acteur mais l'écriture
 * s'appliquait ensuite à n'importe quel `userId` — super-administrateur
 * compris, qu'un simple administrateur pouvait donc rétrograder puis
 * désactiver.
 */
async function requireManageableTarget(userId: string) {
  const actor = await requireAdmin();

  const [target] = await db
    .select({ id: user.id, role: user.role, active: user.active })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) throw new Error("Utilisateur introuvable");

  const verdict = canManageUser(actor, { id: target.id, role: target.role as UserRole });
  if (!verdict.allowed) throw new Error(manageDenialMessage(verdict.reason));

  return { actor, target };
}

// ─── Resource actions ───

export async function updateResourceStatus(
  resourceId: string,
  status: "published" | "rejected" | "flagged" | "pending" | "draft"
) {
  await requireAdmin();
  // Le type de `status` ne contraint que la compilation : cette Server Action
  // est une route HTTP dont les arguments arrivent du réseau.
  const safeStatus = parseOrThrow(resourceStatusSchema, status);
  await db
    .update(resource)
    .set({ status: safeStatus, updatedAt: new Date() })
    .where(eq(resource.id, resourceId));
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/statistiques");
}

// ─── User actions ───

export async function updateUserRole(
  userId: string,
  role: "citizen" | "moderator" | "admin"
) {
  const { actor } = await requireManageableTarget(userId);

  // Liste blanche vérifiée à l'exécution : sans elle, un administrateur
  // pouvait s'attribuer `super_admin`, valeur légitime de l'enum PostgreSQL,
  // en appelant directement cette Server Action.
  if (!canAssignRole(actor.role, role)) throw new Error("Rôle invalide");

  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/utilisateurs");
}

export async function toggleUserActive(userId: string) {
  const { target } = await requireManageableTarget(userId);

  await db
    .update(user)
    .set({ active: !target.active, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/utilisateurs");
}

// ─── Comment actions ───

export async function updateCommentStatus(
  commentId: string,
  status: "visible" | "hidden" | "flagged"
) {
  await requireAdmin();
  const safeStatus = parseOrThrow(commentStatusSchema, status);
  await db
    .update(comment)
    .set({ status: safeStatus, updatedAt: new Date() })
    .where(eq(comment.id, commentId));
  revalidatePath("/admin/moderation");
}

export async function deleteComment(commentId: string) {
  await requireAdmin();
  await db.delete(comment).where(eq(comment.id, commentId));
  revalidatePath("/admin/moderation");
}

// ─── Report actions ───

export async function resolveReport(reportId: string) {
  await requireAdmin();
  await db
    .update(report)
    .set({ resolved: true })
    .where(eq(report.id, reportId));
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/signalements");
}

// ─── Resource admin actions ───

export async function deleteResource(resourceId: string) {
  await requireAdmin();

  const [existing] = await db
    .select({ imageUrl: resource.imageUrl, authorId: resource.authorId })
    .from(resource)
    .where(eq(resource.id, resourceId))
    .limit(1);

  const files = await db
    .select({ url: resourceFile.url })
    .from(resourceFile)
    .where(eq(resourceFile.resourceId, resourceId));

  await db.delete(resource).where(eq(resource.id, resourceId));

  const urlsToDelete = [
    ...(existing?.imageUrl ? [existing.imageUrl] : []),
    ...files.map((f) => f.url),
  ];
  // Propriétaire attendu : l'auteur de la ressource, pas l'administrateur.
  await Promise.allSettled(
    urlsToDelete.map((url) => {
      const key = existing ? getObjectKeyFromUrl(url, existing.authorId) : null;
      return key ? deleteObject(key) : Promise.resolve();
    })
  );

  revalidatePath("/admin/ressources");
  revalidatePath("/catalogue");
}

export async function toggleFeaturedResource(resourceId: string, featured: boolean) {
  await requireAdmin();
  await db
    .update(resource)
    .set({ featured, updatedAt: new Date() })
    .where(eq(resource.id, resourceId));
  revalidatePath("/admin/ressources");
  revalidatePath("/catalogue");
}

// ─── Category actions ───

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}) {
  await requireAdmin();
  const safe = parseOrThrow(categoryInputSchema, data);
  await db.insert(category).values({
    id: crypto.randomUUID(),
    name: safe.name,
    slug: safe.slug,
    description: safe.description ?? null,
    icon: safe.icon ?? null,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/catalogue");
  revalidatePath("/publier");
}

export async function updateCategory(
  categoryId: string,
  data: { name: string; slug: string; description?: string; icon?: string }
) {
  await requireAdmin();
  const safe = parseOrThrow(categoryInputSchema, data);
  await db
    .update(category)
    .set({
      name: safe.name,
      slug: safe.slug,
      description: safe.description ?? null,
      icon: safe.icon ?? null,
    })
    .where(eq(category.id, categoryId));
  revalidatePath("/admin/categories");
  revalidatePath("/catalogue");
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  await db.delete(category).where(eq(category.id, categoryId));
  revalidatePath("/admin/categories");
  revalidatePath("/catalogue");
}

// ─── Super-admin: account management ───

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role: "moderator" | "admin" | "super_admin";
}) {
  await requireSuperAdmin();
  const safeData = parseOrThrow(adminUserCreateSchema, data);
  const { createAdminUserCore } = await import("@/lib/admin-user");
  const result = await createAdminUserCore(safeData);
  if ("error" in result) {
    throw new Error(result.error.message);
  }
  revalidatePath("/admin/utilisateurs");
  return { id: result.id };
}

export async function updateUserRoleAsAdmin(
  userId: string,
  role: "citizen" | "moderator" | "admin" | "super_admin"
) {
  const actor = await requireSuperAdmin();

  const [target] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!target) throw new Error("Utilisateur introuvable");

  // Même un super-administrateur ne modifie pas son propre rôle : c'est le
  // seul garde-fou contre la perte du dernier compte super-administrateur.
  const verdict = canManageUser(actor, { id: target.id, role: target.role as UserRole });
  if (!verdict.allowed) throw new Error(manageDenialMessage(verdict.reason));

  if (!canAssignRole(actor.role, role)) throw new Error("Rôle invalide");

  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/utilisateurs");
}

