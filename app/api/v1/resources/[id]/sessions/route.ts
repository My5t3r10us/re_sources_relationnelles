import { db } from "@/db";
import { resource, resourceSession, sessionParticipant, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";
import { generateUniqueShareCode } from "@/lib/sessions";

const COLLABORATIVE_TYPES = ["exercise", "protocol"] as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireApiAuth(req);
    const { id } = await params;

    const [res] = await db
      .select({ id: resource.id, mediaType: resource.mediaType, status: resource.status })
      .from(resource)
      .where(eq(resource.id, id))
      .limit(1);

    if (!res) return apiError("NOT_FOUND", "Ressource introuvable", 404);
    if (!COLLABORATIVE_TYPES.includes(res.mediaType as (typeof COLLABORATIVE_TYPES)[number])) {
      return apiError("INVALID_STATE", "Seules les ressources de type exercice ou protocole supportent les sessions collaboratives", 400);
    }
    if (res.status !== "published") {
      return apiError("INVALID_STATE", "La ressource doit être publiée", 400);
    }

    const sessionId = crypto.randomUUID();
    const shareCode = await generateUniqueShareCode();

    await db.insert(resourceSession).values({
      id: sessionId,
      resourceId: id,
      hostId: currentUser.id,
      shareCode,
      status: "active",
    });

    await db.insert(sessionParticipant).values({
      id: crypto.randomUUID(),
      sessionId,
      userId: currentUser.id,
    });

    const [hostRow] = await db.select({ name: user.name }).from(user).where(eq(user.id, currentUser.id)).limit(1);

    return apiSuccess(
      {
        id: sessionId,
        shareCode,
        status: "active",
        startedAt: new Date(),
        endedAt: null,
        hostId: currentUser.id,
        hostName: hostRow?.name ?? null,
        resourceId: id,
        participants: [],
      },
      undefined,
      201
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
