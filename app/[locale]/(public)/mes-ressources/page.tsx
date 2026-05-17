import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { resource, category } from "@/db/schema";
import { eq, and, desc, count, SQL } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { Plus, Pencil, Eye, Clock } from "lucide-react";
import { SubmitDraftButton } from "./submit-button";

const statusConfig: Record<string, { label: string; variant: "primary" | "secondary" | "success" | "error" | "outline" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  pending: { label: "En attente", variant: "secondary" },
  published: { label: "Publié", variant: "success" },
  rejected: { label: "Rejeté", variant: "error" },
  flagged: { label: "Signalé", variant: "error" },
};

const privacyConfig: Record<string, { label: string }> = {
  public: { label: "Public" },
  shared: { label: "Partagé" },
  private: { label: "Privé" },
};

const mediaTypeLabels: Record<string, string> = {
  article: "Article",
  video: "Vidéo",
  pdf: "PDF",
  exercise: "Exercice",
  audio: "Audio",
  protocol: "Protocole",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function MesRessourcesPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status ?? "";

  const validStatuses = ["draft", "pending", "published", "rejected", "flagged"];
  const conditions: SQL[] = [eq(resource.authorId, session.user.id)];
  if (statusFilter && validStatuses.includes(statusFilter)) {
    conditions.push(
      eq(resource.status, statusFilter as "draft" | "pending" | "published" | "rejected" | "flagged")
    );
  }

  const [resources, [{ total }]] = await Promise.all([
    db
      .select({
        id: resource.id,
        title: resource.title,
        status: resource.status,
        privacy: resource.privacy,
        mediaType: resource.mediaType,
        viewCount: resource.viewCount,
        readingTime: resource.readingTime,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
        categoryName: category.name,
      })
      .from(resource)
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(and(...conditions))
      .orderBy(desc(resource.updatedAt)),
    db
      .select({ total: count() })
      .from(resource)
      .where(and(...conditions)),
  ]);

  const statusFilters = [
    { value: "", label: "Toutes" },
    { value: "draft", label: "Brouillons" },
    { value: "pending", label: "En attente" },
    { value: "published", label: "Publiées" },
    { value: "rejected", label: "Rejetées" },
  ];

  function buildUrl(status: string) {
    return `/mes-ressources${status ? `?status=${status}` : ""}`;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-display-lg text-on-surface">Mes ressources</h1>
        <Link
          href="/publier"
          className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle ressource
        </Link>
      </div>
      <p className="text-lg text-on-surface-variant mb-8">
        Toutes vos ressources, y compris les brouillons et les contenus privés.
      </p>

      {/* Status filters */}
      <div className="flex items-center gap-1 flex-wrap mb-8">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={buildUrl(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-on-primary-fixed"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="ml-auto text-sm text-on-surface-variant">{total} ressource{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Resources list */}
      <div className="space-y-3">
        {resources.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-16 text-center shadow-ambient-sm">
            <p className="text-on-surface-variant mb-6">
              {statusFilter ? "Aucune ressource avec ce statut." : "Vous n'avez pas encore créé de ressource."}
            </p>
            <Link
              href="/publier"
              className="gradient-primary text-on-primary-fixed rounded-xl px-8 py-3 text-sm font-semibold inline-block"
            >
              Créer ma première ressource
            </Link>
          </div>
        ) : (
          resources.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm hover:shadow-ambient transition-all flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/ressource/${r.id}`}
                    className="font-semibold text-on-surface hover:text-primary transition-colors truncate"
                  >
                    {r.title}
                  </Link>
                  <Badge variant={statusConfig[r.status].variant}>{statusConfig[r.status].label}</Badge>
                  {r.privacy !== "public" && (
                    <Badge variant="outline">{privacyConfig[r.privacy]?.label ?? r.privacy}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                  <span>{mediaTypeLabels[r.mediaType] ?? r.mediaType}</span>
                  {r.categoryName && <span>· {r.categoryName}</span>}
                  {r.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {r.readingTime} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {r.viewCount} vue{r.viewCount !== 1 ? "s" : ""}
                  </span>
                  <span>Modifié {r.updatedAt.toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {r.status === "draft" && <SubmitDraftButton resourceId={r.id} />}
                <Link
                  href={`/ressource/${r.id}/modifier`}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
