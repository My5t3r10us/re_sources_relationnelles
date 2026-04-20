import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Bookmark, CheckCircle, Heart } from "lucide-react";

export default function RessourcePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      {/* Back */}
      <Link
        href="/catalogue"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        Retour au catalogue
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="primary">Anxiété &amp; Stress</Badge>
          <span className="flex items-center gap-1 text-sm text-on-surface-variant">
            <Clock className="w-4 h-4" />
            8 min de lecture
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-6 leading-tight">
          Gérer le burnout au travail : un guide pratique de récupération
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-container-high" />
          <div>
            <p className="font-semibold text-on-surface">Dr. Sarah Jenkins</p>
            <p className="text-sm text-on-surface-variant">
              Psychologue clinicienne
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="bg-surface-container-highest text-primary rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
              <Bookmark className="w-4.5 h-4.5" />
              Ajouter aux favoris
            </button>
            <button className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5" />
              Marquer comme exploité
            </button>
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="aspect-video bg-surface-container-high rounded-xl mb-10 overflow-hidden" />

      {/* Article content */}
      <article className="prose prose-lg max-w-none">
        <p className="text-lg text-on-surface leading-relaxed mb-6">
          Le burnout est bien plus que simplement se sentir fatigué après une
          longue semaine. C&apos;est un état d&apos;épuisement émotionnel, physique et
          mental causé par un stress excessif et prolongé. Il survient lorsque
          vous vous sentez submergé, émotionnellement vidé et incapable de
          répondre aux demandes constantes.
        </p>

        <h2 className="text-headline-md text-on-surface mt-10 mb-4">
          Reconnaître les premiers signes
        </h2>
        <p className="text-on-surface leading-relaxed mb-6">
          Souvent, nous ignorons les signaux subtils que nos corps et nos
          esprits nous envoient. Le chemin vers la récupération commence par la
          reconnaissance. Si vous vous trouvez de plus en plus cynique envers
          votre travail, manquant d&apos;énergie pour être constamment productif, ou
          ressentant un sentiment de terreur au réveil, ce ne sont pas juste des
          &quot;mauvais jours&quot; — ce sont des indicateurs d&apos;un problème systémique.
        </p>

        {/* Blockquote */}
        <div className="relative bg-surface-container-low p-8 rounded-xl my-8">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-tertiary rounded-l-xl" />
          <p className="italic text-on-surface pl-4">
            &quot;La récupération ne consiste pas à revenir à l&apos;état antérieur. Il
            s&apos;agit de construire une nouvelle façon de vivre et de travailler,
            plus durable.&quot;
          </p>
        </div>

        <h2 className="text-headline-md text-on-surface mt-10 mb-4">
          Actions concrètes pour aujourd&apos;hui
        </h2>
        <p className="text-on-surface leading-relaxed mb-6">
          Bien que la récupération profonde prenne du temps, il existe des
          interventions immédiates qui peuvent stabiliser votre quotidien.
          Créer des limites strictes entre le &quot;temps de travail&quot; et le &quot;temps
          personnel&quot; est primordial.
        </p>

        <div className="space-y-4 mb-8">
          {[
            {
              title: "Instaurer un arrêt ferme",
              desc: "Choisissez une heure précise pour terminer votre journée de travail et respectez-la scrupuleusement.",
            },
            {
              title: "Micro-restaurations",
              desc: "Prenez des pauses sensorielles de 5 minutes, loin des écrans, toutes les 90 minutes.",
            },
            {
              title: "Déléguer ou abandonner",
              desc: "Auditez vos tâches actuelles et identifiez au moins une qui peut être reportée ou déléguée.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-tertiary mt-0.5" />
              <div>
                <strong className="text-on-surface">{item.title} :</strong>{" "}
                <span className="text-on-surface-variant">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Comments section */}
      <section className="bg-surface-container-low rounded-2xl p-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md text-on-surface">
            Discussion communautaire
          </h2>
          <Badge variant="secondary">Modéré</Badge>
        </div>

        {/* Comment input */}
        <div className="flex gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
          <div className="flex-1">
            <textarea
              placeholder="Partagez votre expérience ou posez une question..."
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none min-h-[80px]"
            />
            <div className="flex justify-end mt-2">
              <button className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2.5 text-sm font-semibold">
                Publier le commentaire
              </button>
            </div>
          </div>
        </div>

        {/* Example comments */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-on-surface">
                  Alex M.
                </span>
                <span className="text-xs text-on-surface-variant">
                  Il y a 2 heures
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mb-2">
                Le point sur les &quot;micro-restaurations&quot; m&apos;a vraiment parlé. Je
                passe généralement toute la journée sans lever les yeux de mon
                écran, et à 17h je suis complètement vidé. Je vais essayer la
                règle des 90 minutes demain.
              </p>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Heart className="w-4 h-4" />
                  12
                </button>
                <button className="hover:text-primary transition-colors">
                  Répondre
                </button>
              </div>

              {/* Nested reply */}
              <div className="mt-4 ml-2 pl-4 border-l-2 border-primary">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-on-surface">
                        Dr. Sarah Jenkins
                      </span>
                      <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                        Auteur
                      </Badge>
                      <span className="text-xs text-on-surface-variant">
                        Il y a 1 heure
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      C&apos;est merveilleux à entendre, Alex. Commencez petit — même
                      simplement fermer les yeux et prendre cinq respirations
                      profondes compte comme une restauration. Tenez-nous au
                      courant !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
