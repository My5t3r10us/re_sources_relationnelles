"use client";

import { useTransition, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { submitDraftForReview } from "../publier/publish-actions";

export function SubmitDraftButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await submitDraftForReview(resourceId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-error">{error}</span>}
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors text-xs font-semibold disabled:opacity-50"
        title="Soumettre ce brouillon à la modération"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Soumettre
      </button>
    </div>
  );
}
