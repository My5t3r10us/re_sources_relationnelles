import { db } from "@/db";
import { resourceSession, sessionParticipant, user, resource } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // unambiguous chars

export function generateShareCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
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
