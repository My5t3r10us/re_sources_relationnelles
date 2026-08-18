"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { reportClientError } from "@/app/error-actions";

/**
 * Écran de récupération des erreurs de rendu sous `[locale]`.
 *
 * `unstable_retry` remplace `reset` depuis Next.js 16.2 : il refait la requête
 * de données avant de rejouer le rendu, là où `reset` se contentait de
 * remonter la limite d'erreur et réaffichait donc souvent la même panne.
 */
export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    void reportClientError({
      message: error.message,
      digest: error.digest,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-error" />
        </div>
        <h1 className="text-headline-sm text-on-surface mb-2">{t("error")}</h1>
        {error.digest && (
          // Reprise du `digest` dans les journaux serveur : c'est le seul lien
          // entre l'écran affiché au citoyen et la trace exploitable au support.
          <p className="text-sm text-on-surface-variant mb-6">
            <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold gradient-primary text-on-primary-fixed hover:opacity-90 transition-opacity cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t("confirm")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold bg-surface-container-highest text-primary hover:bg-surface-container-high transition-colors"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
