import { db } from "@/db";
import { rateLimit } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { apiError } from "@/lib/api-response";

export interface RateLimitRule {
  /** Nombre maximum de requêtes autorisées dans la fenêtre. */
  max: number;
  /** Durée de la fenêtre, en secondes. */
  windowSec: number;
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Secondes avant réouverture, uniquement quand `allowed` est faux. */
  retryAfter: number;
}

/**
 * Règles par point d'entrée. Volontairement conservatrices : elles visent
 * l'abus automatisé (inondation de signalements, saturation du bucket), pas
 * l'usage normal.
 */
export const RATE_LIMITS = {
  upload: { max: 20, windowSec: 3600 },
  report: { max: 10, windowSec: 3600 },
  comment: { max: 20, windowSec: 600 },
  sessionJoin: { max: 30, windowSec: 600 },
  resourceCreate: { max: 20, windowSec: 3600 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * Identité utilisée comme clé : l'identifiant utilisateur si la requête est
 * authentifiée, sinon l'adresse IP transmise par le reverse proxy.
 */
export function requestIdentity(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * Fenêtre fixe : `lastRequest` marque le début de la fenêtre courante et n'est
 * pas repoussé à chaque requête — un client qui martèle l'endpoint ne peut donc
 * pas décaler indéfiniment sa propre fenêtre.
 *
 * En cas d'erreur de base, on laisse passer : la limitation de débit ne doit
 * pas devenir elle-même une panne de disponibilité.
 */
export async function checkRateLimit(
  scope: string,
  identity: string,
  rule: RateLimitRule
): Promise<RateLimitVerdict> {
  const key = `api:${scope}:${identity}`;
  const now = Date.now();
  const windowMs = rule.windowSec * 1000;

  try {
    const [existing] = await db
      .select({ count: rateLimit.count, lastRequest: rateLimit.lastRequest })
      .from(rateLimit)
      .where(eq(rateLimit.key, key))
      .limit(1);

    if (!existing) {
      await db
        .insert(rateLimit)
        .values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
        .onConflictDoUpdate({
          target: rateLimit.key,
          set: { count: sql`${rateLimit.count} + 1` },
        });
      return { allowed: true, retryAfter: 0 };
    }

    const windowExpired = now - existing.lastRequest >= windowMs;

    if (windowExpired) {
      await db
        .update(rateLimit)
        .set({ count: 1, lastRequest: now })
        .where(eq(rateLimit.key, key));
      return { allowed: true, retryAfter: 0 };
    }

    if (existing.count >= rule.max) {
      const retryAfter = Math.max(1, Math.ceil((existing.lastRequest + windowMs - now) / 1000));
      return { allowed: false, retryAfter };
    }

    await db
      .update(rateLimit)
      .set({ count: sql`${rateLimit.count} + 1` })
      .where(eq(rateLimit.key, key));
    return { allowed: true, retryAfter: 0 };
  } catch (err) {
    console.error("[rate-limit] échec du compteur, requête laissée passer", err);
    return { allowed: true, retryAfter: 0 };
  }
}

/**
 * Applique une règle et retourne une réponse 429 prête à renvoyer, ou `null`
 * si la requête peut continuer.
 *
 *   const limited = await enforceRateLimit("report", requestIdentity(req, user.id), RATE_LIMITS.report);
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  scope: string,
  identity: string,
  rule: RateLimitRule
): Promise<Response | null> {
  const verdict = await checkRateLimit(scope, identity, rule);
  if (verdict.allowed) return null;

  const response = apiError(
    "RATE_LIMITED",
    "Trop de requêtes. Réessayez dans un instant.",
    429
  );
  response.headers.set("Retry-After", String(verdict.retryAfter));
  return response;
}
