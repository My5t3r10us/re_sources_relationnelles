"use client";

import { useTransition, useState } from "react";
import { Bookmark, BookmarkCheck, Share2, CheckCircle2, Circle } from "lucide-react";
import { toggleFavorite, toggleRead, toggleSaved } from "./resource-actions";

export function FavoriteButton({
  resourceId,
  isFavorite: initialFavorite,
  isAuthenticated,
}: {
  resourceId: string;
  isFavorite: boolean;
  isAuthenticated: boolean;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated) return;
    setIsFavorite(!isFavorite);
    startTransition(async () => {
      await toggleFavorite(resourceId);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || !isAuthenticated}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 ${
        isFavorite
          ? "gradient-primary text-on-primary-fixed"
          : "bg-surface-container-highest text-primary"
      }`}
      title={isAuthenticated ? undefined : "Connectez-vous pour ajouter aux favoris"}
    >
      <Bookmark className={`w-4.5 h-4.5 ${isFavorite ? "fill-current" : ""}`} />
      {isFavorite ? "Dans vos favoris" : "Ajouter aux favoris"}
    </button>
  );
}

export function ReadButton({
  resourceId,
  isRead: initialRead,
  isAuthenticated,
}: {
  resourceId: string;
  isRead: boolean;
  isAuthenticated: boolean;
}) {
  const [isRead, setIsRead] = useState(initialRead);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated) return;
    setIsRead(!isRead);
    startTransition(async () => {
      await toggleRead(resourceId);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || !isAuthenticated}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 ${
        isRead
          ? "bg-tertiary/10 text-tertiary border border-tertiary/20"
          : "bg-surface-container-highest text-on-surface-variant"
      }`}
      title={isAuthenticated ? undefined : "Connectez-vous pour marquer comme exploitée"}
    >
      {isRead ? (
        <CheckCircle2 className="w-4.5 h-4.5" />
      ) : (
        <Circle className="w-4.5 h-4.5" />
      )}
      {isRead ? "Exploitée ✓" : "Marquer comme exploitée"}
    </button>
  );
}

export function SaveButton({
  resourceId,
  isSaved: initialSaved,
  isAuthenticated,
}: {
  resourceId: string;
  isSaved: boolean;
  isAuthenticated: boolean;
}) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated) return;
    setIsSaved(!isSaved);
    startTransition(async () => {
      await toggleSaved(resourceId);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || !isAuthenticated}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 ${
        isSaved
          ? "bg-secondary/10 text-secondary border border-secondary/20"
          : "bg-surface-container-highest text-on-surface-variant"
      }`}
      title={isAuthenticated ? undefined : "Connectez-vous pour mettre de côté"}
    >
      {isSaved ? (
        <BookmarkCheck className="w-4.5 h-4.5" />
      ) : (
        <Bookmark className="w-4.5 h-4.5" />
      )}
      {isSaved ? "Mis de côté" : "Mettre de côté"}
    </button>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
    >
      {copied ? (
        <>
          <CheckCircle2 className="w-4.5 h-4.5 text-tertiary" />
          Lien copié !
        </>
      ) : (
        <>
          <Share2 className="w-4.5 h-4.5" />
          Partager
        </>
      )}
    </button>
  );
}
