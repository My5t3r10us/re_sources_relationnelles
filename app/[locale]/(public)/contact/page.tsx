import Link from "next/link";
import { LifeBuoy, ShieldCheck, Scale, AlertTriangle } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  ToComplete,
} from "@/components/legal/legal-page";

const canaux = [
  {
    icon: <LifeBuoy className="w-5 h-5 text-primary" />,
    title: "Support et assistance",
    body: "Difficulté d'utilisation, compte inaccessible, anomalie constatée sur la plateforme.",
    delai: "Réponse sous 3 jours ouvrés",
  },
  {
    icon: <Scale className="w-5 h-5 text-primary" />,
    title: "Protection des données (DPO)",
    body: "Exercice de vos droits d'accès, de rectification, de limitation ou d'opposition.",
    delai: "Réponse sous 1 mois (art. 12 RGPD)",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    title: "Signalement de sécurité",
    body: "Vulnérabilité découverte sur la plateforme. Merci de nous laisser un délai raisonnable de correction avant toute divulgation.",
    delai: "Accusé de réception sous 48 heures",
  },
];

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      intro="Comment joindre l'équipe de (RE)Sources Relationnelles selon la nature de votre demande."
      updatedAt="15 août 2026"
    >
      {/*
        Aucun formulaire n'est proposé : la plateforme n'embarque pas de service
        d'envoi de courriel. Annoncer un formulaire qui n'aboutirait nulle part
        serait pire que d'indiquer une adresse.
      */}
      <div className="rounded-xl bg-error-container/10 p-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
        <div className="text-sm text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface">
            En cas d&apos;urgence, n&apos;utilisez pas ce canal.
          </strong>{" "}
          Si vous ou un proche êtes en danger, composez le 15 (SAMU), le 112
          (urgences européennes) ou le 3114 (prévention du suicide, 24h/24).
          Voir la{" "}
          <Link href="/urgence" className="text-primary hover:underline">
            page d&apos;urgence
          </Link>
          .
        </div>
      </div>

      {canaux.map((canal) => (
        <LegalSection key={canal.title} title={canal.title}>
          <div className="flex items-start gap-3">
            {canal.icon}
            <div className="space-y-2">
              <p>{canal.body}</p>
              <p>
                Adresse : <ToComplete>à compléter</ToComplete>
              </p>
              <p className="text-outline">{canal.delai}</p>
            </div>
          </div>
        </LegalSection>
      ))}

      <LegalSection title="Signaler un contenu">
        <p>
          Un contenu inapproprié, trompeur ou contraire aux règles de la
          plateforme se signale directement depuis la ressource ou le
          commentaire concerné, via le bouton de signalement. Les signalements
          sont traités par l&apos;équipe de modération.
        </p>
      </LegalSection>

      <LegalSection title="Avant de nous écrire">
        <p>
          La{" "}
          <Link href="/aide" className="text-primary hover:underline">
            page d&apos;aide
          </Link>{" "}
          répond aux questions les plus fréquentes. Pour l&apos;export ou la
          suppression de vos données, les deux opérations sont accessibles
          directement depuis votre{" "}
          <Link href="/profil" className="text-primary hover:underline">
            profil
          </Link>
          , sans nous solliciter.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
