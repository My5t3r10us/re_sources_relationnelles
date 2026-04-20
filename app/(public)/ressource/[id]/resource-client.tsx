"use client";

import { useEffect, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleFavorite, markAsRead } from "./resource-actions";
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
