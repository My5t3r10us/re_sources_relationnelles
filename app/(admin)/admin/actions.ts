"use server";

import { db } from "@/db";
import { resource, user, comment, report } from "@/db/schema";
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

  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Accès refusé");
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
}
