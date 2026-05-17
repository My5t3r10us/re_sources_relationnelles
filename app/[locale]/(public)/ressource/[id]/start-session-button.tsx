"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2 } from "lucide-react";

export function StartSessionButton({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/resources/${resourceId}/sessions`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.data?.shareCode) {
        setError(json.error?.message ?? "Impossible de démarrer la session");
        setPending(false);
        return;
      }
      router.push(`/session/${json.data.shareCode}`);
    } catch {
      setError("Erreur réseau");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleStart}
        disabled={pending}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-on-primary-fixed disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
        Démarrer une session
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
