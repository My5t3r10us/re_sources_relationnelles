import type { Instrumentation } from "next";
import { captureError } from "@/lib/telemetry";

/**
 * Point d'entrée d'observabilité de l'application (voir `docs/PLAN_DEPLOIEMENT.md`,
 * section 7). `register` est appelé une fois par instance serveur, avant que la
 * première requête ne soit servie.
 */
export async function register() {
  // `NodeSDK` ne fonctionne pas dans le runtime edge : l'import est donc
  // dynamique et conditionnel, sans quoi la compilation edge échoue.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}

/**
 * Capture les erreurs serveur que Next.js intercepte : rendu de composants
 * serveur, gestionnaires de route et Server Actions.
 *
 * Seuls le chemin et le contexte de routage sont transmis. Ni les en-têtes ni
 * la chaîne de requête ne le sont : ils transportent cookies de session et
 * paramètres de recherche, donc des données personnelles.
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  const error = err as Error & { digest?: string };

  captureError(error, {
    source: "request",
    path: request.path.split("?")[0],
    method: request.method,
    digest: error.digest,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
