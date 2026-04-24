"use client";

import { useEffect, useTransition } from "react";
import { Bookmark, BookmarkCheck, Share2, CheckCircle } from "lucide-react";
import { toggleFavorite, markAsRead, toggleSaved } from "./resource-actions";
import { useState } from "react";

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
    const was = isFavorite;
    setIsFavorite(!was);
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

export function ReadTracker({
  resourceId,
  isAuthenticated,
}: {
  resourceId: string;
  isAuthenticated: boolean;
}) {
  useEffect(() => {
    if (!isAuthenticated) return;
    markAsRead(resourceId);
  }, [resourceId, isAuthenticated]);

  return null;
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
    const was = isSaved;
    setIsSaved(!was);
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
          <CheckCircle className="w-4.5 h-4.5 text-tertiary" />
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
