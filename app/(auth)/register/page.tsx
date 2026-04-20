"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.signUp.email(
      {
        email,
        password,
        name: `${firstName} ${lastName}`,
      },
      {
        onSuccess: () => {
          router.push("/tableau-de-bord");
        },
        onError: (ctx) => {
          setError(ctx.error.message);
        },
      }
    );

    if (error) {
      setError(error.message ?? "Une erreur est survenue");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low">
      <div className="w-full max-w-md space-y-8 bg-surface-container-lowest rounded-xl shadow-ambient p-8">
        <div className="text-center">
          <h1 className="text-headline-lg text-on-surface">Créer un compte</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Inscrivez-vous pour commencer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-error-container/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="text-label-md text-on-surface-variant block mb-1.5"
              >
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
                placeholder="Jean"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="text-label-md text-on-surface-variant block mb-1.5"
              >
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
