import { db } from "@/db";
import { resourceSession, sessionMessage, user } from "@/db/schema";
import { and, eq, gt, asc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";
import { isActiveParticipant } from "@/lib/sessions";

async function loadSession(code: string) {
  const [s] = await db
    .select({ id: resourceSession.id, status: resourceSession.status })
    .from(resourceSession)
    .where(eq(resourceSession.shareCode, code))
    .limit(1);
  return s ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const currentUser = await requireApiAuth(req);
    const { code } = await params;
    const session = await loadSession(code);
    if (!session) return apiError("NOT_FOUND", "Session introuvable", 404);

    const isParticipant = await isActiveParticipant(session.id, currentUser.id);
    if (!isParticipant) return apiError("FORBIDDEN", "Rejoignez la session pour voir les messages", 403);

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const sinceDate = since ? new Date(since) : null;

    const conditions = [eq(sessionMessage.sessionId, session.id)];
    if (sinceDate && !isNaN(sinceDate.getTime())) {
      conditions.push(gt(sessionMessage.createdAt, sinceDate));
    }

    const rows = await db
      .select({
        id: sessionMessage.id,
        content: sessionMessage.content,
        createdAt: sessionMessage.createdAt,
        authorId: sessionMessage.authorId,
        authorName: user.name,
      })
      .from(sessionMessage)
      .innerJoin(user, eq(sessionMessage.authorId, user.id))
      .where(and(...conditions))
      .orderBy(asc(sessionMessage.createdAt));

    return apiSuccess(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const currentUser = await requireApiAuth(req);
    const { code } = await params;
    const session = await loadSession(code);
    if (!session) return apiError("NOT_FOUND", "Session introuvable", 404);
    if (session.status === "ended") return apiError("INVALID_STATE", "Session terminée", 400);

    const isParticipant = await isActiveParticipant(session.id, currentUser.id);
    if (!isParticipant) return apiError("FORBIDDEN", "Rejoignez la session pour envoyer un message", 403);

    const body = await req.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) return apiError("VALIDATION_ERROR", "Le message ne peut pas être vide", 400);
    if (content.length > 2000) return apiError("VALIDATION_ERROR", "Message trop long (max 2000)", 400);

    const id = crypto.randomUUID();
    const createdAt = new Date();
    await db.insert(sessionMessage).values({
      id,
      sessionId: session.id,
      authorId: currentUser.id,
      content,
      createdAt,
    });

    const [authorRow] = await db.select({ name: user.name }).from(user).where(eq(user.id, currentUser.id)).limit(1);

    return apiSuccess(
      { id, content, createdAt, authorId: currentUser.id, authorName: authorRow?.name ?? null },
      undefined,
      201
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
