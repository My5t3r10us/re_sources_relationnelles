import { db } from "@/db";
import { resourceSession, sessionParticipant, user } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";
import { getSessionByCode } from "@/lib/sessions";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireApiAuth(req);
    const { code } = await params;

    const session = await getSessionByCode(code);
    if (!session) return apiError("NOT_FOUND", "Session introuvable", 404);

    const participants = await db
      .select({
        id: sessionParticipant.id,
        userId: sessionParticipant.userId,
        userName: user.name,
        joinedAt: sessionParticipant.joinedAt,
        leftAt: sessionParticipant.leftAt,
      })
      .from(sessionParticipant)
      .innerJoin(user, eq(sessionParticipant.userId, user.id))
      .where(and(eq(sessionParticipant.sessionId, session.id), isNull(sessionParticipant.leftAt)));

    return apiSuccess({ ...session, participants });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const currentUser = await requireApiAuth(req);
    const { code } = await params;

    const [session] = await db
      .select({ id: resourceSession.id, hostId: resourceSession.hostId, status: resourceSession.status })
      .from(resourceSession)
      .where(eq(resourceSession.shareCode, code))
      .limit(1);

    if (!session) return apiError("NOT_FOUND", "Session introuvable", 404);
    if (session.hostId !== currentUser.id) return apiError("FORBIDDEN", "Seul l'hôte peut terminer la session", 403);
    if (session.status === "ended") return apiSuccess({ id: session.id, status: "ended" });

    await db
      .update(resourceSession)
      .set({ status: "ended", endedAt: new Date() })
      .where(eq(resourceSession.id, session.id));

    return apiSuccess({ id: session.id, status: "ended" });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
