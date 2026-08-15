"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Download, Trash2, X, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMyAccount, exportMyData } from "./rgpd-actions";

/**
 * Exercice des droits RGPD depuis le profil : portabilité (art. 20) et
 * effacement (art. 17).
 */
export function RgpdSection() {
  const [pending, startTransition] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleExport() {
    setExportError(null);
    startTransition(async () => {
      try {
        const json = await exportMyData();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        setExportError(
          e instanceof Error ? e.message : "L'export a échoué, réessayez",
        );
      }
    });
  }

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteMyAccount({ password, confirmation });
      } catch (err) {
        // `redirect()` d'une Server Action réussie remonte comme une exception
        // NEXT_REDIRECT : la laisser se propager, sinon la redirection est
        // avalée et l'utilisateur reste sur un profil qui n'existe plus.
        if (
          err instanceof Error &&
          "digest" in err &&
          typeof err.digest === "string" &&
          err.digest.startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setDeleteError(
          err instanceof Error ? err.message : "La suppression a échoué",
        );
      }
    });
  }

  function closeConfirm() {
    if (pending) return;
    setConfirmOpen(false);
    setPassword("");
    setConfirmation("");
    setDeleteError(null);
  }

  return (
    <div className="mt-6 bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-8">
      <h2 className="text-headline-sm text-on-surface mb-1">Mes données</h2>
      <p className="text-sm text-on-surface-variant mb-6">
        Vous disposez d&apos;un droit d&apos;accès, de portabilité et
        d&apos;effacement sur vos données personnelles.{" "}
        <Link href="/confidentialite" className="text-primary hover:underline">
          Politique de confidentialité
        </Link>
      </p>

      <div className="flex items-start justify-between gap-4 py-4">
        <div>
          <h3 className="text-title-md text-on-surface">
            Télécharger mes données
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Récupérez l&apos;ensemble de vos données au format JSON : compte,
            ressources, commentaires, favoris et participations.
          </p>
          {exportError && (
            <p className="rounded-xl bg-error-container/10 p-3 text-sm text-error mt-3">
              {exportError}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={pending}
          className="shrink-0"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exporter
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 py-4">
        <div>
          <h3 className="text-title-md text-on-surface">
            Supprimer mon compte
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Votre identité et vos contenus privés sont définitivement effacés.
            Vos ressources publiées et commentaires visibles sont conservés sous
            la mention « Utilisateur supprimé », afin de ne pas amputer les
            échanges auxquels d&apos;autres citoyens ont participé.
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
          className="shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </Button>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeConfirm}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface">
                Supprimer mon compte
              </h2>
              <button
                onClick={closeConfirm}
                disabled={pending}
                aria-label="Fermer"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 rounded-xl bg-error-container/10 p-4 mb-4">
              <ShieldAlert className="w-5 h-5 text-error shrink-0" />
              <p className="text-sm text-on-surface-variant">
                Cette action est <strong>irréversible</strong>. Pensez à
                exporter vos données avant de continuer.
              </p>
            </div>

            <form onSubmit={handleDelete} className="space-y-4">
              <Input
                id="rgpd-password"
                type="password"
                label="Mot de passe actuel"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                id="rgpd-confirmation"
                type="text"
                label="Saisissez SUPPRIMER pour confirmer"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />

              {deleteError && (
                <p className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeConfirm}
                  disabled={pending}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="danger" disabled={pending}>
                  {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Supprimer définitivement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
