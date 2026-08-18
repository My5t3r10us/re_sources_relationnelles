"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bug, CheckCircle2, Lightbulb, Loader2, MessageSquarePlus, X } from "lucide-react";

type FeedbackType = "feature" | "bug";

/**
 * Dépôt d'une idée ou d'un bug sur le portail Fider, sans quitter le site.
 *
 * Fider n'expose pas de widget intégrable et la CSP de l'application interdit
 * l'inclusion en `iframe` : le formulaire est donc reproduit ici, et publié via
 * `POST /api/v1/feedback`, qui détient seul la clé d'API du portail.
 */
/**
 * `boardUrl` est fourni par le composant serveur parent plutôt que lu ici dans
 * `process.env` : une variable `NEXT_PUBLIC_*` absente à la construction n'est
 * pas figée dans le paquet client, et le bouton serait alors rendu côté serveur
 * mais pas côté navigateur — donc une erreur d'hydratation.
 */
export function FeedbackButton({
  boardUrl,
  className = "",
}: {
  boardUrl?: string;
  className?: string;
}) {
  const t = useTranslations("Feedback");

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le portail n'est pas déployé dans tous les environnements : sans URL
  // publique, le bouton n'a nulle part où renvoyer.
  if (!boardUrl) return null;

  function close() {
    setOpen(false);
    setDone(false);
    setError(null);
    setTitle("");
    setDescription("");
    setType("feature");
    setPostUrl(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            title: title.trim(),
            description: description.trim() || undefined,
          }),
        });

        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          setError(payload?.error?.message ?? t("error"));
          return;
        }

        setPostUrl(payload?.data?.url ?? null);
        setDone(true);
      } catch {
        setError(t("error"));
      }
    });
  }

  const typeOptions: { value: FeedbackType; label: string; Icon: typeof Bug }[] = [
    { value: "feature", label: t("typeFeature"), Icon: Lightbulb },
    { value: "bug", label: t("typeBug"), Icon: Bug },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer ${className}`}
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>{t("trigger")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !pending && close()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("heading")}
            className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-primary" />
                {t("heading")}
              </h2>
              <button
                onClick={close}
                disabled={pending}
                aria-label={t("closeLabel")}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-tertiary mx-auto mb-3" />
                <p className="text-on-surface mb-4">{t("success")}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  {postUrl && (
                    <a
                      href={postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline"
                    >
                      {t("viewPost")}
                    </a>
                  )}
                  <a
                    href={boardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface-variant hover:text-primary"
                  >
                    {t("viewBoard")}
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  role="radiogroup"
                  aria-label={t("heading")}
                  className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container-high"
                >
                  {typeOptions.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={type === value}
                      onClick={() => setType(value)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                        type === value
                          ? "bg-surface-container-lowest text-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="feedback-title"
                    className="block text-label-md text-on-surface-variant mb-2"
                  >
                    {t("title")}
                  </label>
                  <input
                    id="feedback-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={5}
                    maxLength={100}
                    placeholder={t("titlePlaceholder")}
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="feedback-description"
                    className="block text-label-md text-on-surface-variant mb-2"
                  >
                    {t("description")}
                  </label>
                  <textarea
                    id="feedback-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={t("descriptionPlaceholder")}
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
                  />
                </div>

                <p className="text-xs text-on-surface-variant">{t("privacyNotice")}</p>

                {error && (
                  <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={close}
                    disabled={pending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold gradient-primary text-on-primary-fixed inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("submit")}
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
