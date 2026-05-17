import { db } from "@/db";
import { resource, category, user } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface HomeResourceCard {
  id: string;
  title: string;
  summary: string | null;
  mediaType: string;
  readingTime: number | null;
  imageUrl: string | null;
  viewCount: number;
  createdAt: Date;
  categoryName: string | null;
  categorySlug: string | null;
  authorName: string | null;
}

export interface HomeCategorySummary {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  count: number;
}

export interface HomeStats {
  totalResources: number;
  totalUsers: number;
  totalCategories: number;
}

export interface HomeData {
  featured: HomeResourceCard[];
  recent: HomeResourceCard[];
  popularCategories: HomeCategorySummary[];
  stats: HomeStats;
}

const RESOURCE_SELECTION = {
  id: resource.id,
  title: resource.title,
  summary: resource.summary,
  mediaType: resource.mediaType,
  readingTime: resource.readingTime,
  imageUrl: resource.imageUrl,
  viewCount: resource.viewCount,
  createdAt: resource.createdAt,
  categoryName: category.name,
  categorySlug: category.slug,
  authorName: user.name,
};

export async function getHomeData(): Promise<HomeData> {
  const publishedPublic = and(
    eq(resource.status, "published"),
    eq(resource.privacy, "public"),
  );

  const [featuredRows, recentRows, popularCats, [stats]] = await Promise.all([
    db
      .select(RESOURCE_SELECTION)
      .from(resource)
      .leftJoin(category, eq(resource.categoryId, category.id))
      .leftJoin(user, eq(resource.authorId, user.id))
      .where(and(publishedPublic, eq(resource.featured, true)))
      .orderBy(desc(resource.createdAt))
      .limit(3),
    db
      .select(RESOURCE_SELECTION)
      .from(resource)
      .leftJoin(category, eq(resource.categoryId, category.id))
      .leftJoin(user, eq(resource.authorId, user.id))
      .where(publishedPublic)
      .orderBy(desc(resource.createdAt))
      .limit(6),
    db
      .select({
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        count: count(resource.id),
      })
      .from(category)
      .leftJoin(
        resource,
        and(
          eq(resource.categoryId, category.id),
          eq(resource.status, "published"),
          eq(resource.privacy, "public"),
        ),
      )
      .groupBy(category.id, category.name, category.slug, category.icon)
      .orderBy(desc(count(resource.id)))
      .limit(3),
    db
      .select({
        totalResources: sql<number>`(SELECT COUNT(*)::int FROM ${resource} WHERE ${resource.status} = 'published')`,
        totalUsers: sql<number>`(SELECT COUNT(*)::int FROM ${user})`,
        totalCategories: sql<number>`(SELECT COUNT(*)::int FROM ${category})`,
      })
      .from(sql`(SELECT 1) AS dummy`),
  ]);

  return {
    featured: featuredRows,
    recent: recentRows,
    popularCategories: popularCats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      count: Number(c.count),
    })),
    stats: {
      totalResources: Number(stats?.totalResources ?? 0),
      totalUsers: Number(stats?.totalUsers ?? 0),
      totalCategories: Number(stats?.totalCategories ?? 0),
    },
  };
}
