import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";
import { enforceRateLimit, requestIdentity, RATE_LIMITS } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";
import {
  createFiderPost,
  feedbackInputSchema,
  fiderServerConfig,
  buildPostUrl,
  FiderError,
} from "@/lib/fider";

/**
 * Relais vers le portail de retours Fider.
 *
 * Le navigateur n'appelle jamais Fider directement : la clé d'API vaut un
 * compte collaborateur, et la publier côté client permettrait à n'importe qui
 * d'écrire sur le portail. Cette route porte donc l'authentification, la
 * limitation de débit et la validation, puis parle à Fider côté serveur.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);

    // Le portail est public : sans plafond, un seul compte peut le noyer.
    const limited = await enforceRateLimit(
      "feedback",
      requestIdentity(req, currentUser.id),
      RATE_LIMITS.feedback,
    );
    if (limited) return limited;

    const config = fiderServerConfig();
    if (!config) {
      return apiError("FEEDBACK_DISABLED", "Portail de retours non configuré", 503);
    }

    const body = await req.json().catch(() => null);
    const parsed = feedbackInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Retour invalide", 400);
    }

    const post = await createFiderPost(parsed.data, config);

    await logAdminAction({
      actorId: currentUser.id,
      event: "feedback.submitted",
      targetType: "feedback",
      targetId: String(post.number),
      metadata: { type: parsed.data.type },
    });

    return apiSuccess(
      {
        number: post.number,
        slug: post.slug,
        url: buildPostUrl(process.env.NEXT_PUBLIC_FIDER_URL, post.number, post.slug),
      },
      undefined,
      201,
    );
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof FiderError) {
      // Message générique : le détail renvoyé par Fider est déjà journalisé.
      return apiError("FEEDBACK_UNAVAILABLE", "Portail de retours indisponible", 502);
    }
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
