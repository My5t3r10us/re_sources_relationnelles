import { db } from "@/db";
import { resourceSession, sessionParticipant, user, resource } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // unambiguous chars

/**
 * Code de partage tiré d'un générateur cryptographique.
 *
 * `Math.random()` n'est pas sûr : son état interne se reconstruit à partir de
 * quelques sorties observées, ce qui permettait de prédire les codes suivants
 * et de rejoindre des sessions privées — un code suffit pour entrer et lire
 * toute la messagerie.
 *
 * L'alphabet fait 32 caractères, soit une puissance de deux : le masquage sur
 * 5 bits est donc uniforme, sans biais de modulo.
 */
export function generateShareCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    code += ALPHABET[bytes[i] & 31];
  }
  return code;
}

export async function generateUniqueShareCode(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateShareCode();
    const [existing] = await db
      .select({ id: resourceSession.id })
      .from(resourceSession)
      .where(eq(resourceSession.shareCode, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("Impossible de générer un code unique");
}

export async function getSessionByCode(code: string) {
  const [session] = await db
    .select({
      id: resourceSession.id,
      shareCode: resourceSession.shareCode,
      status: resourceSession.status,
      startedAt: resourceSession.startedAt,
      endedAt: resourceSession.endedAt,
      hostId: resourceSession.hostId,
      hostName: user.name,
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceMediaType: resource.mediaType,
    })
    .from(resourceSession)
    .innerJoin(user, eq(resourceSession.hostId, user.id))
    .innerJoin(resource, eq(resourceSession.resourceId, resource.id))
    .where(eq(resourceSession.shareCode, code))
    .limit(1);

  return session ?? null;
}

export async function isActiveParticipant(sessionId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: sessionParticipant.id })
    .from(sessionParticipant)
    .where(
      and(
        eq(sessionParticipant.sessionId, sessionId),
        eq(sessionParticipant.userId, userId),
        isNull(sessionParticipant.leftAt)
      )
    )
    .limit(1);
  return !!row;
}
