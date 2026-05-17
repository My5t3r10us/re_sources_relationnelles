import { db } from "@/db";
import { resourceSession, sessionParticipant } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const currentUser = await requireApiAuth(req);
    const { code } = await params;

    const [session] = await db
      .select({ id: resourceSession.id, status: resourceSession.status })
      .from(resourceSession)
      .where(eq(resourceSession.shareCode, code))
      .limit(1);

    if (!session) return apiError("NOT_FOUND", "Session introuvable", 404);
    if (session.status === "ended") return apiError("INVALID_STATE", "Cette session est terminée", 400);

    // Idempotent: only insert if not already an active participant
    const [existing] = await db
      .select({ id: sessionParticipant.id })
      .from(sessionParticipant)
      .where(
        and(
          eq(sessionParticipant.sessionId, session.id),
          eq(sessionParticipant.userId, currentUser.id),
          isNull(sessionParticipant.leftAt)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(sessionParticipant).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        userId: currentUser.id,
      });
    }

    return apiSuccess({ joined: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
