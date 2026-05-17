"use client";

import { useState, useTransition } from "react";
import { UserPlus, X, Loader2, ShieldCheck, Shield, Crown } from "lucide-react";
import { createAdminUser } from "../actions";

const ROLES = [
  { value: "moderator", label: "Modérateur", icon: <Shield className="w-4 h-4" /> },
  { value: "admin", label: "Admin", icon: <ShieldCheck className="w-4 h-4" /> },
  { value: "super_admin", label: "Super-Admin", icon: <Crown className="w-4 h-4" /> },
] as const;

export function CreateUserModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("moderator");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("moderator");
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createAdminUser({ name: name.trim(), email: email.trim(), password, role });
        setSuccess(true);
        setTimeout(() => handleClose(), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la création");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="gradient-primary text-on-primary-fixed rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Créer un compte
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !pending && handleClose()}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Nouveau compte administrateur
              </h2>
              <button
                onClick={handleClose}
                disabled={pending}
                aria-label="Fermer"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="py-8 text-center">
                <ShieldCheck className="w-12 h-12 text-tertiary mx-auto mb-3" />
                <p className="text-on-surface">Compte créé avec succès.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-label-md text-on-surface-variant mb-1.5">Nom complet</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant mb-1.5">
                    Mot de passe initial (8 caractères min.)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant mb-2">Rôle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-xs font-medium transition-colors ${
                          role === r.value
                            ? "bg-primary text-on-primary-fixed"
                            : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                        }`}
                      >
                        {r.icon}
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">{error}</div>
                )}

                <div className="flex items-center gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={pending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold gradient-primary text-on-primary-fixed inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Créer le compte
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
