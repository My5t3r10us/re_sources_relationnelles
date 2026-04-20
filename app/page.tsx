import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, MessageSquare, Search, Clock, PlayCircle, Headphones, Bookmark } from "lucide-react";

const featuredResources = [
  {
    id: "1",
    title: "Gérer l'anxiété au travail : guide pratique",
    summary:
      "Stratégies concrètes pour gérer le stress en milieu professionnel, créées en collaboration avec des thérapeutes.",
    category: "Guide",
    readingTime: 15,
    icon: "self_improvement",
  },
  {
    id: "2",
    title: "Construire des dynamiques familiales résilientes",
    summary:
      "Une approche modulaire pour favoriser la communication ouverte et la sécurité émotionnelle au sein de la famille.",
    category: "Cours interactif",
    modules: 4,
    icon: "family_restroom",
  },
  {
    id: "3",
    title: "L'architecture de l'empathie : Ép. 4",
    summary:
      "Dr. Elena Rostova explore les fondements neurologiques de l'empathie et comment la cultiver au quotidien.",
    category: "Podcast",
    duration: 45,
    icon: "headphones",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h1 className="text-display-lg text-on-surface mb-6">
                Votre réseau collaboratif pour le{" "}
                <span className="text-primary">bien-être social</span>
              </h1>
              <p className="text-lg text-on-surface-variant mb-8 max-w-lg">
                Découvrez, partagez et connectez-vous à travers une plateforme
                conçue pour renforcer la résilience communautaire et favoriser
                des relations saines.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/catalogue"
                  className="gradient-primary text-on-primary-fixed rounded-xl px-8 py-4 text-base font-semibold inline-flex items-center justify-center gap-2"
                >
                  Explorer le catalogue
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/communaute"
                  className="bg-surface-container-highest text-primary rounded-xl px-8 py-4 text-base font-semibold inline-flex items-center justify-center"
                >
                  Rejoindre la communauté
                </Link>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 h-100 md:h-125">
              <div className="bg-surface-container-high rounded-4xl row-span-2 overflow-hidden" />
              <div className="bg-surface-container-high rounded-3xl overflow-hidden" />
              <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col justify-end">
                <MessageSquare className="w-6 h-6 text-primary mb-2" />
                <p className="font-bold text-on-surface text-sm">Réseau actif</p>
                <p className="text-xs text-on-surface-variant">
                  2 450+ ressources partagées par des experts et la communauté.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="bg-surface-container-low py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-headline-lg text-on-surface mb-8">
              Trouvez le soutien dont vous avez besoin
            </h2>
            <div className="flex items-center bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
              <Search className="w-5 h-5 text-on-surface-variant ml-4" />
              <input
                type="text"
                placeholder="Rechercher par sujet, mot-clé ou type de ressource..."
                className="flex-1 px-4 py-4 bg-transparent border-none focus:outline-none text-on-surface placeholder:text-outline"
              />
              <Link
                href="/catalogue"
                className="gradient-primary text-on-primary-fixed px-6 py-3 m-1.5 rounded-lg font-semibold text-sm"
              >
                Rechercher
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Populaires :
              </span>
              {["Anxiété & Stress", "Équilibre de vie", "Parentalité"].map(
                (tag) => (
                  <Link
                    key={tag}
                    href="/catalogue"
                    className="px-3 py-1 rounded-full bg-surface-container-lowest text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {tag}
                  </Link>
                )
              )}
            </div>
          </div>
        </section>

        {/* Featured Resources */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-headline-lg text-on-surface">
                Ressources à la une
              </h2>
              <p className="text-on-surface-variant mt-1">
                Guides et outils sélectionnés pour le bien-être relationnel.
              </p>
            </div>
            <Link
              href="/catalogue"
              className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredResources.map((res) => (
              <Link key={res.id} href={`/ressource/${res.id}`} className="group">
                <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
                  <div className="aspect-[4/3] bg-surface-container-high relative overflow-hidden">
                    <div className="absolute top-3 left-3">
                      <span className="bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-on-surface">
                        {res.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-3 flex-1">
                      {res.summary}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                        {res.readingTime ? <Clock className="w-4 h-4" /> : res.modules ? <PlayCircle className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                        {res.readingTime
                          ? `${res.readingTime} min`
                          : res.modules
                            ? `${res.modules} Modules`
                            : `${res.duration} min`}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
                        <Bookmark className="w-5 h-5" />
                        Sauvegarder
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
