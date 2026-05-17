"use server";

import { db } from "@/db";
import { report, resource, comment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";

const VALID_REASONS = ["harassment", "spam", "misinformation", "inappropriate", "other"] as const;
type Reason = (typeof VALID_REASONS)[number];

interface SubmitReportParams {
  reason: Reason;
  description?: string;
  resourceId?: string;
  commentId?: string;
}

export async function submitReport(params: SubmitReportParams) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Connectez-vous pour signaler un contenu");

  const { reason, description, resourceId, commentId } = params;

  if (!VALID_REASONS.includes(reason)) throw new Error("Motif invalide");
  if ((!resourceId && !commentId) || (resourceId && commentId)) {
    throw new Error("Préciser soit une ressource, soit un commentaire");
  }

  if (resourceId) {
    const [r] = await db.select({ id: resource.id }).from(resource).where(eq(resource.id, resourceId)).limit(1);
    if (!r) throw new Error("Ressource introuvable");
  } else if (commentId) {
    const [c] = await db.select({ id: comment.id }).from(comment).where(eq(comment.id, commentId)).limit(1);
    if (!c) throw new Error("Commentaire introuvable");
  }

  await db.insert(report).values({
    id: crypto.randomUUID(),
    reason,
    description: description?.trim() || null,
    resourceId: resourceId ?? null,
    commentId: commentId ?? null,
    reporterId: session.user.id,
    resolved: false,
  });
}
