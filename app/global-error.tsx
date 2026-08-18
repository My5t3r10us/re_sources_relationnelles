"use client";

import { useEffect } from "react";
import { reportClientError } from "@/app/error-actions";
import "./globals.css";

/**
 * Dernier filet : erreurs survenues dans la mise en page racine elle-même.
 *
 * Ce fichier REMPLACE `app/[locale]/layout.tsx` quand il s'active : il doit
 * donc porter ses propres balises `html`/`body`, et ne peut pas utiliser
 * `next-intl`, dont le fournisseur vient précisément de la mise en page qui a
 * échoué. Les libellés sont donc en français, langue par défaut du portail.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    void reportClientError({
      message: error.message,
      digest: error.digest,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [error]);

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex items-center justify-center px-6 py-24">
        <main className="max-w-md w-full text-center">
          <h1 className="text-headline-sm text-on-surface mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-sm text-on-surface-variant mb-6">
            Le service rencontre un incident. Nos équipes en sont informées.
            {error.digest && (
              <>
                {" "}
                <span className="font-mono">{error.digest}</span>
              </>
            )}
          </p>
          <button
            onClick={() => unstable_retry()}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold gradient-primary text-on-primary-fixed hover:opacity-90 transition-opacity cursor-pointer"
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
