import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { db } from "@/db";
import { resource, user, category } from "@/db/schema";
import { eq, count, desc, ilike, and, SQL } from "drizzle-orm";
import Link from "next/link";
import { AdminResourceActions } from "./resource-admin-actions";
import { CategorySelect } from "./category-select";

const ITEMS_PER_PAGE = 15;

const statusConfig: Record<string, { label: string; variant: "primary" | "secondary" | "success" | "error" | "outline" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  pending: { label: "En attente", variant: "secondary" },
  published: { label: "Publié", variant: "success" },
  rejected: { label: "Rejeté", variant: "error" },
  flagged: { label: "Signalé", variant: "error" },
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
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
    categoryId?: string;
  }>;
}

export default async function AdminRessourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const search = params.q ?? "";
  const categoryFilter = params.categoryId ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const validStatuses = ["draft", "pending", "published", "rejected", "flagged"];

  const conditions: SQL[] = [];
  if (statusFilter && validStatuses.includes(statusFilter)) {
    conditions.push(
      eq(resource.status, statusFilter as "draft" | "pending" | "published" | "rejected" | "flagged")
    );
  }
  if (search) conditions.push(ilike(resource.title, `%${search}%`));
  if (categoryFilter) conditions.push(eq(resource.categoryId, categoryFilter));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [resources, [{ total }], categories] = await Promise.all([
    db
      .select({
        id: resource.id,
        title: resource.title,
        status: resource.status,
        mediaType: resource.mediaType,
        privacy: resource.privacy,
        featured: resource.featured,
        viewCount: resource.viewCount,
        createdAt: resource.createdAt,
        authorName: user.name,
        categoryName: category.name,
      })
      .from(resource)
      .innerJoin(user, eq(resource.authorId, user.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(whereClause)
      .orderBy(desc(resource.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset((page - 1) * ITEMS_PER_PAGE),
    db.select({ total: count() }).from(resource).where(whereClause),
    db.select({ id: category.id, name: category.name }).from(category).orderBy(category.name),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, total);

  function buildUrl(p: Record<string, string>) {
    const sp = new URLSearchParams(p);
    return `/admin/ressources?${sp.toString()}`;
  }

  const statusFilters = [
    { value: "", label: "Toutes" },
    { value: "pending", label: "En attente" },
    { value: "published", label: "Publiées" },
    { value: "draft", label: "Brouillons" },
    { value: "rejected", label: "Rejetées" },
    { value: "flagged", label: "Signalées" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-display-lg text-on-surface mb-2">Gestion des ressources</h1>
      <p className="text-lg text-on-surface-variant mb-8">
        Administrez, modérez et organisez toutes les ressources de la plateforme.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-1 flex-wrap">
          {statusFilters.map((f) => (
            <Link
              key={f.value}
              href={buildUrl({
                ...(f.value ? { status: f.value } : {}),
                ...(search ? { q: search } : {}),
                ...(categoryFilter ? { categoryId: categoryFilter } : {}),
              })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form method="get" action="/admin/ressources" className="flex items-center gap-2 ml-auto">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {categoryFilter && <input type="hidden" name="categoryId" value={categoryFilter} />}
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Rechercher..."
            className="bg-surface-container-high rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
          />
          <CategorySelect categories={categories} defaultValue={categoryFilter} />
          <button
            type="submit"
            className="bg-primary text-on-primary-fixed rounded-xl px-4 py-2 text-sm font-medium"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Count */}
      <p className="text-sm text-on-surface-variant mb-4">
        {total === 0 ? "Aucune ressource" : `${start}–${end} sur ${total} ressource${total > 1 ? "s" : ""}`}
      </p>

      {/* List */}
      <div className="space-y-2 mb-8">
        {resources.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-ambient-sm">
            <p className="text-on-surface-variant">Aucune ressource trouvée.</p>
          </div>
        ) : (
          resources.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient-sm flex items-center gap-4 hover:shadow-ambient transition-all"
            >
              {r.featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/ressource/${r.id}`}
                    className="font-semibold text-on-surface hover:text-primary transition-colors truncate"
                  >
                    {r.title}
                  </Link>
                  <Badge variant={statusConfig[r.status].variant}>
                    {statusConfig[r.status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                  <span>{r.authorName}</span>
                  {r.categoryName && <span>· {r.categoryName}</span>}
                  <span>· {mediaTypeLabels[r.mediaType] ?? r.mediaType}</span>
                  <span>· {r.viewCount} vue{r.viewCount !== 1 ? "s" : ""}</span>
                  <span>· {r.createdAt.toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <AdminResourceActions
                resourceId={r.id}
                currentStatus={r.status}
                isFeatured={r.featured}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          {page > 1 ? (
            <Link
              href={buildUrl({ ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { q: search } : {}), page: String(page - 1) })}
            >
              <Button variant="secondary" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
            </Button>
          )}
          <span className="text-sm text-on-surface-variant">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildUrl({ ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { q: search } : {}), page: String(page + 1) })}
            >
              <Button variant="secondary" size="sm">
                Suivant <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Suivant <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
