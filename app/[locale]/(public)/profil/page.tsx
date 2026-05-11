"use client";

import { authClient } from "@/lib/auth-client";
import { User, Mail, Shield, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Chargement...</div>
      </main>
    );
  }

  if (!session) return null;

  const user = session.user;

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/tableau-de-bord"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>

        <h1 className="text-display-lg text-on-surface mb-2">Mon profil</h1>
        <p className="text-on-surface-variant mb-10">
          Gérez vos informations personnelles
        </p>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-8">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-outline-variant/20">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <h2 className="text-headline-md text-on-surface">{user.name}</h2>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Nom complet</p>
                <p className="text-sm font-medium text-on-surface">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Email</p>
                <p className="text-sm font-medium text-on-surface">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Statut du compte</p>
                <p className="text-sm font-medium text-on-surface">Actif</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Membre depuis</p>
                <p className="text-sm font-medium text-on-surface">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
