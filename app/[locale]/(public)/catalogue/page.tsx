import { db } from "@/db";
import { resource, category } from "@/db/schema";
import { eq, ilike, desc, asc, and, count } from "drizzle-orm";
import { SidebarCatalog } from "@/components/layout/sidebar-catalog";
import { CatalogueClient } from "./catalogue-client";

const ITEMS_PER_PAGE = 9;

interface PageProps {
  searchParams: Promise<{
    categorie?: string;
    media?: string;
    q?: string;
    tri?: string;
    page?: string;
  }>;
}

export default async function CataloguePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categorieSlug = params.categorie ?? "";
  const mediaFilter = params.media ?? "";
  const search = params.q ?? "";
  const tri = params.tri ?? "recent";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  // Build conditions
  const conditions = [eq(resource.status, "published"), eq(resource.privacy, "public")];

  if (categorieSlug) {
    const cat = await db.select().from(category).where(eq(category.slug, categorieSlug)).limit(1);
    if (cat.length > 0) {
      conditions.push(eq(resource.categoryId, cat[0].id));
    }
  }

  if (mediaFilter) {
    conditions.push(eq(resource.mediaType, mediaFilter as "article" | "video" | "pdf" | "exercise" | "audio" | "protocol"));
  }

  if (search) {
    conditions.push(ilike(resource.title, `%${search}%`));
  }

  const whereClause = and(...conditions);

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(resource)
    .where(whereClause);

  // Order
  let orderBy;
  switch (tri) {
    case "populaire":
      orderBy = desc(resource.viewCount);
      break;
    case "ancien":
      orderBy = asc(resource.createdAt);
      break;
    default:
      orderBy = desc(resource.createdAt);
  }

  // Fetch resources with category join
  const resources = await db
    .select({
      id: resource.id,
      title: resource.title,
      summary: resource.summary,
      mediaType: resource.mediaType,
      readingTime: resource.readingTime,
      featured: resource.featured,
      viewCount: resource.viewCount,
      createdAt: resource.createdAt,
      imageUrl: resource.imageUrl,
      categoryName: category.name,
      categorySlug: category.slug,
    })
    .from(resource)
    .leftJoin(category, eq(resource.categoryId, category.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(ITEMS_PER_PAGE)
    .offset((page - 1) * ITEMS_PER_PAGE);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // Fetch all categories for sidebar
  const categories = await db.select().from(category).orderBy(asc(category.name));

  return (
    <div className="flex min-h-screen">
      <SidebarCatalog categories={categories} activeSlug={categorieSlug} />
      <CatalogueClient
        resources={resources}
        total={total}
        currentPage={page}
        totalPages={totalPages}
        activeMedia={mediaFilter}
        activeSort={tri}
        search={search}
      />
    </div>
  );
}
