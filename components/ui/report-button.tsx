"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2, X, CheckCircle2 } from "lucide-react";
import { submitReport } from "@/app/[locale]/(public)/ressource/[id]/report-actions";

const REASONS: { value: string; label: string }[] = [
  { value: "harassment", label: "Harcèlement" },
  { value: "spam", label: "Spam" },
  { value: "misinformation", label: "Désinformation" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "other", label: "Autre" },
];

interface Props {
  resourceId?: string;
  commentId?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ReportButton({ resourceId, commentId, size = "md", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("harassment");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitReport({
          reason: reason as "harassment" | "spam" | "misinformation" | "inappropriate" | "other",
          description: description.trim() || undefined,
          resourceId,
          commentId,
        });
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          setDone(false);
          setDescription("");
          setReason("harassment");
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du signalement");
      }
    });
  }

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const buttonClass =
    size === "sm"
      ? "p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"
      : "rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 bg-surface-container-highest text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${buttonClass} ${className}`}
        title="Signaler ce contenu"
        aria-label="Signaler"
      >
        <Flag className={iconSize} />
        {size === "md" && <span>Signaler</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                <Flag className="w-5 h-5 text-error" /> Signaler
              </h2>
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="Fermer"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-tertiary mx-auto mb-3" />
                <p className="text-on-surface">Signalement envoyé. Merci !</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-label-md text-on-surface-variant mb-2">
                    Motif
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Décrivez brièvement le problème..."
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">{error}</div>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-error text-on-error inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Envoyer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
