import { z } from "zod";
import { captureError, type EnvLike } from "@/lib/telemetry";

/**
 * Client du portail de retours Fider.
 *
 * La clé d'API Fider appartient à un compte collaborateur : elle autorise la
 * lecture et l'écriture sur l'ensemble du portail. Elle ne doit donc jamais
 * atteindre le navigateur, d'où ce module strictement serveur, appelé par
 * `app/api/v1/feedback/route.ts` qui sert de relais.
 */

export const FEEDBACK_TYPES = ["feature", "bug"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/**
 * L'API de création de publication Fider n'accepte que `title` et
 * `description` : la nature du retour est donc encodée dans le titre, ce qui
 * la rend visible sur le portail et filtrable par les modérateurs.
 */
const TITLE_PREFIX: Record<FeedbackType, string> = {
  feature: "[Fonctionnalité]",
  bug: "[Bug]",
};

export const feedbackInputSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  title: z.string().trim().min(5, "Le titre est trop court").max(100),
  description: z.string().trim().max(1000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export function buildFiderTitle(type: FeedbackType, title: string): string {
  return `${TITLE_PREFIX[type]} ${title.trim()}`;
}

export interface FiderServerConfig {
  url: string;
  apiKey: string;
}

export function fiderServerConfig(env: EnvLike = process.env): FiderServerConfig | null {
  const url = env.FIDER_URL?.trim();
  const apiKey = env.FIDER_API_KEY?.trim();
  if (!url || !apiKey) return null;
  return { url: url.replace(/\/+$/, ""), apiKey };
}

/**
 * URL publique d'une publication. Construite depuis l'URL publique du portail
 * et non depuis `FIDER_URL`, qui peut être une adresse interne inaccessible
 * au navigateur.
 */
export function buildPostUrl(
  boardUrl: string | undefined,
  number: number,
  slug: string,
): string | null {
  const base = boardUrl?.trim().replace(/\/+$/, "");
  if (!base) return null;
  return `${base}/posts/${number}/${encodeURIComponent(slug)}`;
}

export interface FiderPost {
  number: number;
  slug: string;
}

/** Levée quand Fider est injoignable ou refuse la publication. */
export class FiderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FiderError";
  }
}

/**
 * Crée une publication sur le portail.
 *
 * Aucune donnée personnelle n'est transmise : les publications portent le
 * compte collaborateur de la clé d'API, et le lien avec le citoyen à l'origine
 * du retour reste dans le journal d'audit local.
 */
export async function createFiderPost(
  input: FeedbackInput,
  config: FiderServerConfig,
): Promise<FiderPost> {
  let response: Response;

  try {
    response = await fetch(`${config.url}/api/v1/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        title: buildFiderTitle(input.type, input.title),
        description: input.description ?? "",
      }),
      // Un portail lent ne doit pas immobiliser un worker Next.js.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    captureError(err, { source: "fider.create_post", stage: "network" });
    throw new FiderError("Portail de retours injoignable");
  }

  if (!response.ok) {
    // Le corps d'erreur de Fider peut contenir l'URL interne du portail et des
    // détails de configuration : il est journalisé, jamais renvoyé au client.
    const detail = await response.text().catch(() => "");
    captureError(new Error(`Fider a répondu ${response.status}`), {
      source: "fider.create_post",
      status: response.status,
      detail: detail.slice(0, 500),
    });
    throw new FiderError("Publication refusée par le portail de retours");
  }

  const payload = (await response.json().catch(() => null)) as Partial<FiderPost> | null;

  if (!payload || typeof payload.number !== "number" || typeof payload.slug !== "string") {
    captureError(new Error("Réponse Fider inattendue"), { source: "fider.create_post" });
    throw new FiderError("Réponse inattendue du portail de retours");
  }

  return { number: payload.number, slug: payload.slug };
}
