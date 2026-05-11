"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Auth.register");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
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
      setError(error.message ?? t("genericError"));
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low">
      <div className="w-full max-w-md space-y-8 bg-surface-container-lowest rounded-xl shadow-ambient p-8">
        <div className="text-center">
          <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{t("subheading")}</p>
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
                {t("firstName")}
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
                placeholder={t("firstNamePlaceholder")}
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="text-label-md text-on-surface-variant block mb-1.5"
              >
                {t("lastName")}
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
                placeholder={t("lastNamePlaceholder")}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
              placeholder={t("passwordPlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-label-md text-on-surface-variant block mb-1.5"
            >
              {t("confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none"
              placeholder={t("passwordPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant">
          {t("alreadyAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
