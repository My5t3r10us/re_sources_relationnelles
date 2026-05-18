"use server";

import { db } from "@/db";
import { resource, user, comment, report, category, resourceFile } from "@/db/schema";
import { deleteObject, getObjectKeyFromUrl } from "@/lib/s3";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
    throw new Error("Accès refusé");
  }
  return session.user;
}

async function requireSuperAdmin() {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || dbUser.role !== "super_admin") {
    throw new Error("Accès réservé au super-administrateur");
  }
  return session.user;
}

// ─── Resource actions ───

export async function updateResourceStatus(
  resourceId: string,
  status: "published" | "rejected" | "flagged" | "pending" | "draft"
) {
  await requireAdmin();
  await db
    .update(resource)
    .set({ status, updatedAt: new Date() })
    .where(eq(resource.id, resourceId));
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/statistiques");
}

// ─── User actions ───

export async function updateUserRole(
  userId: string,
  role: "citizen" | "moderator" | "admin"
) {
  await requireAdmin();
  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/utilisateurs");
}

export async function toggleUserActive(userId: string) {
  await requireAdmin();

  const [target] = await db
    .select({ active: user.active })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) throw new Error("Utilisateur introuvable");

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
  await db
    .update(comment)
    .set({ status, updatedAt: new Date() })
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
    .select({ imageUrl: resource.imageUrl })
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
  await Promise.allSettled(
    urlsToDelete.map((url) => {
      const key = getObjectKeyFromUrl(url);
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
  await db.insert(category).values({
    id: crypto.randomUUID(),
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    icon: data.icon ?? null,
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
  await db
    .update(category)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      icon: data.icon ?? null,
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
  const { createAdminUserCore } = await import("@/lib/admin-user");
  const result = await createAdminUserCore(data);
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
  await requireSuperAdmin();
  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/utilisateurs");
}

