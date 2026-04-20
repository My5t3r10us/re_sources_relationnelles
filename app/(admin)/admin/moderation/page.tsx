import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Flag, ShieldAlert, Trash2, CheckCircle } from "lucide-react";

const moderationItems = [
  {
    id: "1",
    type: "comment" as const,
    status: "flagged" as const,
    author: "Jean Dupont",
    initials: "JD",
    context: 'Commentaire sur "Gérer le burnout"',
    title: "Signalement de contenu inapproprié",
    quote:
      '"Cette ressource est complètement inutile et l\'auteur ne sait clairement pas de quoi il parle. Ne perdez pas votre temps."',
    flagInfo: "Signalé par 4 utilisateurs pour : Harcèlement/Toxicité",
    date: "",
  },
  {
    id: "2",
    type: "resource" as const,
    status: "pending" as const,
    author: "Marie Laurent",
    initials: "ML",
    context: "Soumis il y a 2 heures",
    title: "Guide de médiation en milieu de travail",
    description:
      "Un cadre complet pour les professionnels RH et les chefs d'équipe...",
    tags: ["Article PDF", "Résolution de conflits"],
    date: "",
  },
  {
    id: "3",
    type: "resource" as const,
    status: "pending" as const,
    author: "Alain Bernard",
    initials: "AB",
    context: "Soumis il y a 5 heures",
    title: "Exercices de pleine conscience hebdomadaires pour fonctionnaires",
    description:
      "Courts guides audio de 5 minutes conçus pour être pratiqués au...",
    tags: ["Série audio", "Santé mentale"],
    date: "",
  },
  {
    id: "4",
    type: "resource" as const,
    status: "flagged" as const,
    author: "Système auto-flag",
    initials: "SYS",
    context: "Détecté il y a 1 jour",
    title: "Surmonter la dépression rapidement",
    description:
      "Un document de conseil médical non vérifié qui prétend offrir...",
    flagInfo:
      "Violation : Allégations médicales non vérifiées / Préjudice potentiel",
    date: "",
  },
];

export default function ModerationPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg text-on-surface mb-2">
            File de modération
          </h1>
          <p className="text-on-surface-variant">
            Examinez le contenu signalé et les ressources en attente pour
            maintenir l&apos;intégrité de l&apos;écosystème (RE)Sources Relationnelles.
          </p>
        </div>
        <button className="bg-surface-container-highest text-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2">
          <Filter className="w-4.5 h-4.5" />
          Filtrer
        </button>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-title-md text-on-surface">
          Nécessite attention
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <Badge variant="secondary">12 En attente</Badge>
          <Badge variant="error">3 Signalés</Badge>
        </div>
      </div>

      {/* Moderation cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moderationItems.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    item.initials === "SYS"
                      ? "bg-error/10 text-error"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {item.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm text-on-surface">
                    {item.author}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {item.context}
                  </p>
                </div>
              </div>
              <Badge
                variant={item.status === "flagged" ? "error" : "secondary"}
              >
                {item.status === "flagged" ? "🚩 Signalé" : "⏳ En attente"}
              </Badge>
            </div>

            {/* Content */}
            <h3 className="text-title-md text-on-surface mb-2">
              {item.title}
            </h3>

            {item.quote && (
              <div className="bg-surface-container-low rounded-lg p-4 mb-3">
                <p className="text-sm text-on-surface-variant italic">
                  {item.quote}
                </p>
              </div>
            )}

            {item.description && (
              <p className="text-sm text-on-surface-variant mb-3">
                {item.description}
              </p>
            )}

            {item.tags && (
              <div className="flex items-center gap-2 mb-3">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {item.flagInfo && (
              <p className="text-sm text-error flex items-center gap-1 mb-4">
                {item.type === "comment" ? <Flag className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                {item.flagInfo}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-auto pt-4">
              {item.type === "comment" && item.status === "flagged" ? (
                <>
                  <Button variant="ghost" size="sm">
                    Ignorer le signalement
                  </Button>
                  <Button variant="danger" size="sm">
                    <Trash2 className="w-4 h-4" />
                    Supprimer le commentaire
                  </Button>
                </>
              ) : item.status === "flagged" ? (
                <>
                  <Button variant="ghost" size="sm">
                    Examiner le contenu
                  </Button>
                  <Button variant="danger" size="sm">
                    Dépublier la ressource
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm">
                    Voir les détails
                  </Button>
                  <Button variant="secondary" size="sm">
                    Rejeter
                  </Button>
                  <Button variant="primary" size="sm">
                    <CheckCircle className="w-4 h-4" />
                    Approuver
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
