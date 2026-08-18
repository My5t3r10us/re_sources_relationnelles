"use server";

import { captureError } from "@/lib/telemetry";

/**
 * Remontée des erreurs survenues dans le navigateur.
 *
 * Passer par une Server Action plutôt que par un exportateur OTLP côté client
 * évite d'ouvrir `connect-src` vers l'instance OneUptime dans la CSP de
 * `next.config.ts`, et garde le jeton d'ingestion côté serveur.
 */
export async function reportClientError(input: {
  message: string;
  digest?: string;
  path?: string;
}): Promise<void> {
  // Une Server Action exportée est une route HTTP réelle : les entrées sont
  // bornées avant d'atteindre la télémétrie.
  const message = String(input?.message ?? "Erreur client inconnue").slice(0, 500);

  captureError(new Error(message), {
    source: "client",
    digest: input?.digest ? String(input.digest).slice(0, 100) : undefined,
    path: input?.path ? String(input.path).slice(0, 200) : undefined,
  });
}
