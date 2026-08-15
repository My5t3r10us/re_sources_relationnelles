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
import { logAdminAction } from "@/lib/audit-log";
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
  const actor = await requireAdmin();
  // Le type de `status` ne contraint que la compilation : cette Server Action
  // est une route HTTP dont les arguments arrivent du réseau.
  const safeStatus = parseOrThrow(resourceStatusSchema, status);
  await db
    .update(resource)
    .set({ status: safeStatus, updatedAt: new Date() })
    .where(eq(resource.id, resourceId));
  await logAdminAction({
    actorId: actor.id,
    event: "resource.status_changed",
    targetType: "resource",
    targetId: resourceId,
    metadata: { status: safeStatus },
  });
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
  await logAdminAction({
    actorId: actor.id,
    event: "user.role_changed",
    targetType: "user",
    targetId: userId,
    metadata: { role },
  });
  revalidatePath("/admin/utilisateurs");
}

export async function toggleUserActive(userId: string) {
  const { actor, target } = await requireManageableTarget(userId);

  await db
    .update(user)
    .set({ active: !target.active, updatedAt: new Date() })
    .where(eq(user.id, userId));
  await logAdminAction({
    actorId: actor.id,
    event: "user.active_toggled",
    targetType: "user",
    targetId: userId,
    metadata: { active: !target.active },
  });
  revalidatePath("/admin/utilisateurs");
}

// ─── Comment actions ───

export async function updateCommentStatus(
  commentId: string,
  status: "visible" | "hidden" | "flagged"
) {
  const actor = await requireAdmin();
  const safeStatus = parseOrThrow(commentStatusSchema, status);
  await db
    .update(comment)
    .set({ status: safeStatus, updatedAt: new Date() })
    .where(eq(comment.id, commentId));
  await logAdminAction({
    actorId: actor.id,
    event: "comment.status_changed",
    targetType: "comment",
    targetId: commentId,
    metadata: { status: safeStatus },
  });
  revalidatePath("/admin/moderation");
}

export async function deleteComment(commentId: string) {
  const actor = await requireAdmin();
  await db.delete(comment).where(eq(comment.id, commentId));
  await logAdminAction({
    actorId: actor.id,
    event: "comment.deleted",
    targetType: "comment",
    targetId: commentId,
  });
  revalidatePath("/admin/moderation");
}

// ─── Report actions ───

export async function resolveReport(reportId: string) {
  const actor = await requireAdmin();
  await db
    .update(report)
    .set({ resolved: true })
    .where(eq(report.id, reportId));
  await logAdminAction({
    actorId: actor.id,
    event: "report.resolved",
    targetType: "report",
    targetId: reportId,
  });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/signalements");
}

// ─── Resource admin actions ───

export async function deleteResource(resourceId: string) {
  const actor = await requireAdmin();

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

  await logAdminAction({
    actorId: actor.id,
    event: "resource.deleted",
    targetType: "resource",
    targetId: resourceId,
  });

  revalidatePath("/admin/ressources");
  revalidatePath("/catalogue");
}

export async function toggleFeaturedResource(resourceId: string, featured: boolean) {
  const actor = await requireAdmin();
  await db
    .update(resource)
    .set({ featured: Boolean(featured), updatedAt: new Date() })
    .where(eq(resource.id, resourceId));
  await logAdminAction({
    actorId: actor.id,
    event: "resource.featured_toggled",
    targetType: "resource",
    targetId: resourceId,
    metadata: { featured: Boolean(featured) },
  });
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
  const actor = await requireAdmin();
  const safe = parseOrThrow(categoryInputSchema, data);
  const categoryId = crypto.randomUUID();
  await db.insert(category).values({
    id: categoryId,
    name: safe.name,
    slug: safe.slug,
    description: safe.description ?? null,
    icon: safe.icon ?? null,
  });
  await logAdminAction({
    actorId: actor.id,
    event: "category.created",
    targetType: "category",
    targetId: categoryId,
    metadata: { slug: safe.slug },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/catalogue");
  revalidatePath("/publier");
}

export async function updateCategory(
  categoryId: string,
  data: { name: string; slug: string; description?: string; icon?: string }
) {
  const actor = await requireAdmin();
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
  await logAdminAction({
    actorId: actor.id,
    event: "category.updated",
    targetType: "category",
    targetId: categoryId,
    metadata: { slug: safe.slug },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/catalogue");
}

export async function deleteCategory(categoryId: string) {
  const actor = await requireAdmin();
  await db.delete(category).where(eq(category.id, categoryId));
  await logAdminAction({
    actorId: actor.id,
    event: "category.deleted",
    targetType: "category",
    targetId: categoryId,
  });
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
  const actor = await requireSuperAdmin();
  const safeData = parseOrThrow(adminUserCreateSchema, data);
  const { createAdminUserCore } = await import("@/lib/admin-user");
  const result = await createAdminUserCore(safeData);
  if ("error" in result) {
    throw new Error(result.error.message);
  }
  await logAdminAction({
    actorId: actor.id,
    event: "user.created",
    targetType: "user",
    targetId: result.id,
    metadata: { role: safeData.role },
  });
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
  await logAdminAction({
    actorId: actor.id,
    event: "user.role_changed",
    targetType: "user",
    targetId: userId,
    metadata: { role, by: "super_admin" },
  });
  revalidatePath("/admin/utilisateurs");
}

