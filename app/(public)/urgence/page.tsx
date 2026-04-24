import Link from "next/link";
import { Phone, AlertTriangle, Shield, Clock, ArrowRight, Heart, MessageCircle } from "lucide-react";

const emergencyContacts = [
  {
    name: "SAMU",
    number: "15",
    description: "Urgences médicales - disponible 24h/24",
    color: "bg-red-500/10 text-red-600",
  },
  {
    name: "SOS Amitié",
    number: "09 72 39 40 50",
    description: "Écoute et soutien émotionnel - 24h/24, 7j/7",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    name: "Fil Santé Jeunes",
    number: "0 800 235 236",
    description: "Écoute anonyme et gratuite pour les 12-25 ans",
    color: "bg-green-500/10 text-green-600",
  },
  {
    name: "3114 – Numéro national de prévention du suicide",
    number: "3114",
    description: "Ligne d'écoute confidentielle, gratuite, 24h/24",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    name: "Violences Femmes Info",
    number: "3919",
    description: "Écoute et orientation pour les femmes victimes de violence",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    name: "Enfance en Danger",
    number: "119",
    description: "Signalement et écoute pour les enfants en danger",
    color: "bg-orange-500/10 text-orange-600",
  },
];

const immediateActions = [
  {
    icon: <Heart className="w-5 h-5 text-primary" />,
    title: "Respirez profondément",
    description: "Inspirez 4 secondes, retenez 4 secondes, expirez 6 secondes. Répétez 5 fois.",
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: "Mettez-vous en sécurité",
    description: "Si vous êtes en danger physique, éloignez-vous et appelez le 15 ou le 112.",
  },
  {
    icon: <MessageCircle className="w-5 h-5 text-primary" />,
    title: "Parlez à quelqu'un",
    description: "Contactez un proche de confiance ou appelez l'un des numéros ci-dessous.",
  },
];

export default function UrgencePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Hero with alert */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 md:p-8 mb-12">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-2">
              Urgence & Aide immédiate
            </h1>
            <p className="text-on-surface-variant">
              Si vous ou quelqu&apos;un de votre entourage êtes en danger immédiat, appelez le
              <a href="tel:15" className="font-bold text-red-600 mx-1">15</a>
              ou le
              <a href="tel:112" className="font-bold text-red-600 mx-1">112</a>
              immédiatement.
            </p>
          </div>
        </div>
      </div>

      {/* Immediate actions */}
      <div className="mb-16">
        <h2 className="text-headline-lg text-on-surface mb-6">
          Actions immédiates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {immediateActions.map((action) => (
            <div key={action.title} className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                {action.icon}
              </div>
              <h3 className="text-title-md text-on-surface mb-2">{action.title}</h3>
              <p className="text-sm text-on-surface-variant">{action.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Phone className="w-6 h-6 text-primary" />
          <h2 className="text-headline-lg text-on-surface">
            Numéros d&apos;urgence
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyContacts.map((contact) => (
            <a
              key={contact.name}
              href={`tel:${contact.number.replace(/\s/g, "")}`}
              className="group bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient transition-all p-6 flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl ${contact.color} flex items-center justify-center shrink-0`}>
                <Phone className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-title-md text-on-surface group-hover:text-primary transition-colors">
                  {contact.name}
                </h3>
                <p className="text-sm text-on-surface-variant">{contact.description}</p>
              </div>
              <div className="text-xl font-bold text-primary shrink-0">
                {contact.number}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Resources link */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-12 text-center">
        <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-headline-lg text-on-surface mb-4">
          Ressources de soutien de crise
        </h2>
        <p className="text-on-surface-variant mb-6 max-w-xl mx-auto">
          Consultez notre catalogue de ressources spécialisées pour les situations
          de crise, incluant des techniques d&apos;ancrage et des protocoles d&apos;urgence.
        </p>
        <Link
          href="/catalogue?categorie=soutien-crise"
          className="inline-flex items-center gap-2 gradient-primary text-on-primary-fixed rounded-xl px-8 py-3 font-semibold"
        >
          Voir les ressources de crise
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </main>
  );
}
