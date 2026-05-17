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
      .select({ id: resourceSession.id })
      .from(resourceSession)
      .where(eq(resourceSession.shareCode, code))
      .limit(1);

    if (!session) return apiError("NOT_FOUND", "Session introuvable", 404);

    await db
      .update(sessionParticipant)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(sessionParticipant.sessionId, session.id),
          eq(sessionParticipant.userId, currentUser.id),
          isNull(sessionParticipant.leftAt)
        )
      );

    return apiSuccess({ left: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
