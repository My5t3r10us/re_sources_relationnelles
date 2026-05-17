import { db } from "@/db";
import { report, resource, comment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

const VALID_REASONS = ["harassment", "spam", "misinformation", "inappropriate", "other"] as const;
type Reason = (typeof VALID_REASONS)[number];

export async function POST(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);
    const body = await req.json();
    const { reason, description, resourceId, commentId } = body ?? {};

    if (!reason || !VALID_REASONS.includes(reason)) {
      return apiError("VALIDATION_ERROR", "Motif invalide", 400);
    }
    if ((!resourceId && !commentId) || (resourceId && commentId)) {
      return apiError("VALIDATION_ERROR", "Préciser soit resourceId, soit commentId", 400);
    }

    // Verify the target exists
    if (resourceId) {
      const [r] = await db.select({ id: resource.id }).from(resource).where(eq(resource.id, resourceId)).limit(1);
      if (!r) return apiError("NOT_FOUND", "Ressource introuvable", 404);
    } else if (commentId) {
      const [c] = await db.select({ id: comment.id }).from(comment).where(eq(comment.id, commentId)).limit(1);
      if (!c) return apiError("NOT_FOUND", "Commentaire introuvable", 404);
    }

    const id = crypto.randomUUID();
    await db.insert(report).values({
      id,
      reason: reason as Reason,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      resourceId: resourceId ?? null,
      commentId: commentId ?? null,
      reporterId: currentUser.id,
      resolved: false,
    });

    return apiSuccess({ id }, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
