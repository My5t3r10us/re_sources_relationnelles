import Link from "next/link";
import { Heart, Sun, Moon, Smile, ArrowRight, Leaf, Music, BookOpen } from "lucide-react";

const themes = [
  {
    icon: <Sun className="w-6 h-6 text-primary" />,
    title: "Gestion du stress",
    description: "Techniques de respiration, méditation guidée et exercices de pleine conscience pour retrouver le calme.",
    href: "/catalogue?categorie=anxiete-stress",
  },
  {
    icon: <Moon className="w-6 h-6 text-primary" />,
    title: "Sommeil & récupération",
    description: "Rituels du soir, hygiène du sommeil et méthodes pour améliorer la qualité de votre repos.",
    href: "/catalogue?media=article&q=sommeil",
  },
  {
    icon: <Smile className="w-6 h-6 text-primary" />,
    title: "Confiance en soi",
    description: "Exercices pratiques pour renforcer l'estime de soi et développer une image positive.",
    href: "/catalogue?media=exercise",
  },
  {
    icon: <Leaf className="w-6 h-6 text-primary" />,
    title: "Équilibre de vie",
    description: "Trouver l'harmonie entre vie professionnelle, personnelle et engagements sociaux.",
    href: "/catalogue?categorie=equilibre-vie",
  },
  {
    icon: <Music className="w-6 h-6 text-primary" />,
    title: "Relaxation guidée",
    description: "Séances audio et vidéo de relaxation progressive et de visualisation positive.",
    href: "/catalogue?media=audio",
  },
  {
    icon: <BookOpen className="w-6 h-6 text-primary" />,
    title: "Développement personnel",
    description: "Articles et guides pour mieux se comprendre et évoluer au quotidien.",
    href: "/catalogue?media=article",
  },
];

export default function BienEtrePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Hero */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
            <Heart className="w-6 h-6 text-on-primary-fixed" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface">
            Bien-être
          </h1>
        </div>
        <p className="text-lg text-on-surface-variant max-w-2xl">
          Prenez soin de vous au quotidien. Découvrez des ressources sélectionnées par
          des professionnels pour améliorer votre santé mentale et votre qualité de vie.
        </p>
      </div>

      {/* Themes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {themes.map((theme) => (
          <Link key={theme.title} href={theme.href} className="group">
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all p-6 h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                {theme.icon}
              </div>
              <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors">
                {theme.title}
              </h3>
              <p className="text-sm text-on-surface-variant flex-1">
                {theme.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-4">
                Explorer <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-12 text-center">
        <h2 className="text-headline-lg text-on-surface mb-4">
          Besoin d&apos;un accompagnement personnalisé ?
        </h2>
        <p className="text-on-surface-variant mb-6 max-w-xl mx-auto">
          Parcourez notre catalogue complet de ressources ou contactez un professionnel
          pour un soutien adapté à votre situation.
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 gradient-primary text-on-primary-fixed rounded-xl px-8 py-3 font-semibold"
        >
          Voir le catalogue
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </main>
  );
}
