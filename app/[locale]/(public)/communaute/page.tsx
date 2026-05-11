import Link from "next/link";
import { Users, MessageCircle, Heart, Share2, ArrowRight, Globe, HandHeart, BookOpen } from "lucide-react";

const sections = [
  {
    icon: <MessageCircle className="w-6 h-6 text-primary" />,
    title: "Partager vos expériences",
    description:
      "Publiez des ressources qui vous ont aidé et contribuez à enrichir la communauté pour le bien de tous.",
    action: "Publier une ressource",
    href: "/publier",
  },
  {
    icon: <BookOpen className="w-6 h-6 text-primary" />,
    title: "Découvrir & apprendre",
    description:
      "Explorez les ressources partagées par d'autres membres : articles, exercices, vidéos et bien plus.",
    action: "Voir le catalogue",
    href: "/catalogue",
  },
  {
    icon: <HandHeart className="w-6 h-6 text-primary" />,
    title: "Soutenir les autres",
    description:
      "Commentez, encouragez et partagez les ressources qui vous semblent précieuses avec votre entourage.",
    action: "Explorer",
    href: "/catalogue",
  },
];

const values = [
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Bienveillance",
    description: "Un espace sécurisé et respectueux pour chacun.",
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: "Entraide",
    description: "Le partage de connaissances pour grandir ensemble.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Accessibilité",
    description: "Des ressources gratuites, ouvertes à tous.",
  },
];

export default function CommunautePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Hero */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
            <Users className="w-6 h-6 text-on-primary-fixed" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface">
            Communauté
          </h1>
        </div>
        <p className="text-lg text-on-surface-variant max-w-2xl">
          Rejoignez une communauté engagée autour du bien-être relationnel.
          Partagez, découvrez et soutenez-vous mutuellement.
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              {section.icon}
            </div>
            <h3 className="text-title-md text-on-surface mb-2">
              {section.title}
            </h3>
            <p className="text-sm text-on-surface-variant flex-1 mb-4">
              {section.description}
            </p>
            <Link
              href={section.href}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {section.action} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-12 mb-16">
        <h2 className="text-headline-lg text-on-surface mb-8 text-center">
          Nos valeurs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((v) => (
            <div key={v.title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                {v.icon}
              </div>
              <h3 className="text-title-md text-on-surface mb-1">{v.title}</h3>
              <p className="text-sm text-on-surface-variant">{v.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-headline-md text-on-surface mb-4">
          Prêt à contribuer ?
        </h2>
        <p className="text-on-surface-variant mb-6 max-w-lg mx-auto">
          Partagez vos connaissances et expériences pour aider d&apos;autres personnes
          dans leur parcours de bien-être.
        </p>
        <Link
          href="/publier"
          className="inline-flex items-center gap-2 gradient-primary text-on-primary-fixed rounded-xl px-8 py-3 font-semibold"
        >
          Publier une ressource
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </main>
  );
}
