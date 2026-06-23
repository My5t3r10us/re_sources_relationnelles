"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  ShieldOff,
  X,
  Loader2,
  Copy,
  Download,
  Check,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Mode = null | "enable" | "disable";
type EnableStep = "password" | "verify";

export function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);

  // Flux d'activation
  const [step, setStep] = useState<EnableStep>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode(null);
    setStep("password");
    setPassword("");
    setCode("");
    setTotpUri("");
    setBackupCodes([]);
    setSavedAck(false);
    setCopied(false);
    setError(null);
    setPending(false);
  }

  async function handleEnableStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { data, error } = await authClient.twoFactor.enable({ password });
    setPending(false);
    if (error || !data) {
      setError(
        error?.code === "INVALID_PASSWORD"
          ? "Mot de passe incorrect."
          : error?.message ?? "Impossible d'activer la double authentification."
      );
      return;
    }
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes ?? []);
    setStep("verify");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (error) {
      setError(
        error.code === "INVALID_CODE"
          ? "Code invalide. Vérifiez l'heure de votre téléphone et réessayez."
          : error.message ?? "Échec de la vérification."
      );
      return;
    }
    reset();
    router.refresh();
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.twoFactor.disable({ password });
    setPending(false);
    if (error) {
      setError(
        error.code === "INVALID_PASSWORD"
          ? "Mot de passe incorrect."
          : error.message ?? "Impossible de désactiver la double authentification."
      );
      return;
    }
    reset();
    router.refresh();
  }

  function copyCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCodes() {
    const blob = new Blob(
      [
        "Codes de secours — (RE)Sources Relationnelles\n\n" +
          backupCodes.join("\n") +
          "\n\nConservez ces codes en lieu sûr. Chaque code n'est utilisable qu'une fois.",
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codes-de-secours-resources.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
            {enabled ? (
              <ShieldCheck className="w-5 h-5 text-tertiary" />
            ) : (
              <ShieldOff className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              Double authentification (2FA)
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5 max-w-md">
              Renforcez la sécurité de votre compte avec une application
              d&apos;authentification (Microsoft Authenticator, Google
              Authenticator…).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {enabled ? (
            <Badge variant="success" dot>
              Activée
            </Badge>
          ) : (
            <Badge variant="outline">Désactivée</Badge>
          )}
          {enabled ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                reset();
                setMode("disable");
              }}
            >
              Désactiver
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                reset();
                setMode("enable");
              }}
            >
              Activer
            </Button>
          )}
        </div>
      </div>

      {/* Modal */}
      {mode && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !pending && reset()}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface">
                {mode === "disable"
                  ? "Désactiver la 2FA"
                  : step === "password"
                    ? "Activer la 2FA"
                    : "Configurer l'application"}
              </h2>
              <button
                onClick={reset}
                disabled={pending}
                aria-label="Fermer"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Étape mot de passe (activation) */}
            {mode === "enable" && step === "password" && (
              <form onSubmit={handleEnableStart} className="space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Confirmez votre mot de passe pour démarrer la configuration.
                </p>
                <Input
                  id="tfa-password"
                  type="password"
                  label="Mot de passe actuel"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={reset}>
                    Annuler
                  </Button>
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Continuer
                  </Button>
                </div>
              </form>
            )}

            {/* Étape QR + codes + vérification (activation) */}
            {mode === "enable" && step === "verify" && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <p className="text-sm text-on-surface-variant mb-3">
                    1. Scannez ce QR code avec votre application
                    d&apos;authentification.
                  </p>
                  <div className="flex justify-center bg-white rounded-xl p-4">
                    {totpUri && (
                      <QRCodeSVG value={totpUri} size={180} level="M" />
                    )}
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-on-surface-variant cursor-pointer hover:text-primary">
                      Impossible de scanner ? Saisir la clé manuellement
                    </summary>
                    <code className="mt-2 block break-all rounded-lg bg-surface-container-high px-3 py-2 text-xs text-on-surface select-all">
                      {totpUri}
                    </code>
                  </details>
                </div>

                {backupCodes.length > 0 && (
                  <div className="rounded-xl border border-outline-variant/30 p-3">
                    <p className="text-sm font-semibold text-on-surface mb-1">
                      2. Conservez vos codes de secours
                    </p>
                    <p className="text-xs text-on-surface-variant mb-2">
                      Utilisables une seule fois si vous perdez votre téléphone.
                      Ils ne seront plus affichés ensuite.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-sm text-on-surface mb-2">
                      {backupCodes.map((c) => (
                        <span
                          key={c}
                          className="bg-surface-container-high rounded px-2 py-1 text-center select-all"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyCodes}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? "Copié" : "Copier"}
                      </button>
                      <button
                        type="button"
                        onClick={downloadCodes}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </button>
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                      <input
                        type="checkbox"
                        checked={savedAck}
                        onChange={(e) => setSavedAck(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      J&apos;ai sauvegardé mes codes de secours
                    </label>
                  </div>
                )}

                <div>
                  <p className="text-sm text-on-surface-variant mb-2">
                    3. Saisissez le code à 6 chiffres affiché dans
                    l&apos;application.
                  </p>
                  <Input
                    id="tfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="tracking-[0.4em] text-center text-lg"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={reset}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={pending || code.length !== 6 || !savedAck}
                  >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Activer
                  </Button>
                </div>
              </form>
            )}

            {/* Désactivation */}
            {mode === "disable" && (
              <form onSubmit={handleDisable} className="space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Confirmez votre mot de passe pour désactiver la double
                  authentification. Votre compte sera moins protégé.
                </p>
                <Input
                  id="tfa-disable-password"
                  type="password"
                  label="Mot de passe actuel"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={reset}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="danger" size="sm" disabled={pending}>
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Désactiver
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
