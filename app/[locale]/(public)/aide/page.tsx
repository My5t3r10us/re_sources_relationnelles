import Link from "next/link";
import Image from "next/image";
import { Info, Search, Bookmark, ShieldCheck, CheckCircle } from "lucide-react";

const faqItems = [
  {
    question: "Ce service est-il gratuit ?",
    answer:
      "Oui, l'accès au catalogue et aux ressources de base est entièrement gratuit, financé par des initiatives de santé publique.",
  },
  {
    question: "Les professionnels listés sont-ils vérifiés ?",
    answer:
      "Absolument. Chaque organisation et individu listé subit un processus de vérification strict par notre comité d'autorité sanitaire.",
  },
  {
    question: "Que faire si j'ai besoin d'aide immédiate ?",
    answer:
      "Si vous êtes en danger immédiat ou traversez une crise sévère, veuillez utiliser l'onglet 'Urgence' dans la navigation ou appeler les services d'urgence locaux directement.",
  },
];

export default function AidePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface mb-6">
          Aide &amp; Présentation
        </h1>
        <p className="text-lg text-on-surface-variant max-w-xl">
          Un guide simple pour comprendre et naviguer vos ressources. Nous nous
          engageons à fournir un environnement sécurisé, transparent et
          bienveillant pour votre parcours de bien-être.
        </p>
      </div>

      {/* How it works + Mission */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-20">
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8 md:p-10">
          <Info className="w-8 h-8 text-primary mb-4 block" />
          <h2 className="text-headline-lg text-on-surface mb-4">
            Comment ça fonctionne
          </h2>
          <p className="text-on-surface-variant mb-6 leading-relaxed">
            (RE)Sources Relationnelles est conçu pour vous connecter avec des
            professionnels de santé validés et des réseaux de soutien. Parcourez
            le catalogue, filtrez selon vos besoins spécifiques, et contactez
            directement ou sauvegardez des ressources pour plus tard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-on-surface mb-2">
                <Search className="w-5 h-5 text-primary" />
                Explorer
              </h3>
              <p className="text-sm text-on-surface-variant">
                Recherchez dans notre base de données de ressources de bien-être
                et de soutien en situation de crise.
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-bold text-on-surface mb-2">
                <Bookmark className="w-5 h-5 text-primary" />
                Sauvegarder
              </h3>
              <p className="text-sm text-on-surface-variant">
                Gardez une trace des articles utiles et des contacts dans votre
                espace personnel de bien-être.
              </p>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8">
          <h3 className="text-headline-md text-on-surface mb-4">
            Notre mission
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Démocratiser l&apos;accès aux ressources de santé relationnelle, en
            fournissant une plateforme sobre, faisant autorité et profondément
            empathique pour tous les citoyens en quête de soutien.
          </p>
          <div className="aspect-video bg-surface-container-high rounded-xl overflow-hidden relative">
            <Image
              src="/assets/images/aide.jpg"
              alt=""
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Privacy & RGPD */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8 md:p-12 mb-20">
        <div className="flex flex-col md:flex-row gap-10">
          <div className="md:w-1/3">
            <ShieldCheck className="w-10 h-10 text-primary mb-4 block" />
            <h2 className="text-headline-lg text-on-surface">
              Confidentialité &amp; Protection des données
            </h2>
          </div>
          <div className="md:w-2/3">
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Votre confiance est notre priorité absolue. En tant qu&apos;initiative
              officielle de santé publique, nous respectons strictement les
              normes RGPD (Règlement Général sur la Protection des Données) pour
              garantir la confidentialité de vos données personnelles.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Minimisation des données",
                  desc: "Nous ne collectons que les informations strictement nécessaires à la fourniture de nos services.",
                },
                {
                  title: "Stockage sécurisé",
                  desc: "Toutes les requêtes de santé sensibles sont chiffrées de bout en bout.",
                },
                {
                  title: "Vos droits",
                  desc: "Vous avez le droit d'accéder, de modifier ou de supprimer vos données à tout moment via les paramètres de votre compte.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-tertiary mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">
                      {item.title}
                    </h4>
                    <p className="text-sm text-on-surface-variant">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/confidentialite"
              className="gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 mt-8"
            >
              Lire la politique de confidentialité complète
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h2 className="text-headline-lg text-on-surface mb-2">
          Questions fréquemment posées
        </h2>
        <p className="text-on-surface-variant">
          Réponses rapides aux questions courantes.
        </p>
      </div>
      <div className="max-w-4xl mx-auto space-y-4">
        {faqItems.map((faq) => (
          <div
            key={faq.question}
            className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6"
          >
            <h3 className="font-bold text-on-surface mb-2">{faq.question}</h3>
            <p className="text-sm text-on-surface-variant">{faq.answer}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
