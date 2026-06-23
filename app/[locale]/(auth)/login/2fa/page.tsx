"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice });

    setLoading(false);

    if (error) {
      setError(
        error.code === "INVALID_CODE" || error.code === "INVALID_BACKUP_CODE"
          ? "Code invalide. Réessayez."
          : error.message ?? "Échec de la vérification."
      );
      return;
    }

    router.push("/tableau-de-bord");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low">
      <div className="w-full max-w-md space-y-8 bg-surface-container-lowest rounded-xl shadow-ambient p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-headline-lg text-on-surface">
            Vérification en deux étapes
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {useBackup
              ? "Saisissez l'un de vos codes de secours."
              : "Saisissez le code à 6 chiffres de votre application d'authentification."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="code"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              {useBackup ? "Code de secours" : "Code de vérification"}
            </label>
            <input
              id="code"
              inputMode={useBackup ? "text" : "numeric"}
              autoComplete="one-time-code"
              autoFocus
              required
              value={code}
              onChange={(e) =>
                setCode(
                  useBackup
                    ? e.target.value.trim()
                    : e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              placeholder={useBackup ? "xxxxxxxxxx" : "000000"}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface text-center text-lg tracking-[0.3em] placeholder:text-outline placeholder:tracking-normal focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>

          {!useBackup && (
            <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="rounded accent-primary"
              />
              Se souvenir de cet appareil pendant 30 jours
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (!useBackup && code.length !== 6)}
            className="w-full gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Vérifier
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setUseBackup((v) => !v);
            setCode("");
            setError("");
          }}
          className="block w-full text-center text-sm font-semibold text-primary hover:underline"
        >
          {useBackup
            ? "Utiliser l'application d'authentification"
            : "Utiliser un code de secours"}
        </button>
      </div>
    </div>
  );
}
