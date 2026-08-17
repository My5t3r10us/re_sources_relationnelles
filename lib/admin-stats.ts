import { db } from "@/db";
import {
  category,
  comment,
  completion,
  favorite,
  report,
  resource,
  savedResource,
  user,
} from "@/db/schema";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  or,
  sql,
  sum,
  type SQL,
} from "drizzle-orm";

export const ADMIN_STATS_PERIODS = ["all", "7d", "30d", "90d", "12m"] as const;
export const ADMIN_STATS_MEDIA_TYPES = ["article", "video", "pdf", "exercise", "audio", "protocol"] as const;

export type AdminStatsPeriod = (typeof ADMIN_STATS_PERIODS)[number];
export type AdminStatsMediaType = (typeof ADMIN_STATS_MEDIA_TYPES)[number];

export interface AdminStatsFilters {
  period: AdminStatsPeriod;
  mediaType: AdminStatsMediaType | "all";
  categoryId: string | "all";
  region: string | "all";
}

export interface AdminStats {
  filters: AdminStatsFilters;
  period: {
    label: string;
    start: string;
    end: string;
    grain: "day" | "week";
  };
  metrics: {
    users: number;
    resources: number;
    views: number;
    pendingResources: number;
    publishedResources: number;
    reports: number;
    unresolvedReports: number;
    comments: number;
  };
  engagement: {
    favorites: number;
    completions: number;
    savedResources: number;
    completionRate: number;
  };
  moderation: {
    averagePublicationHours: number;
    hiddenComments: number;
    resolvedShare: number;
    reportsByReason: Array<{ reason: string; resolved: number; unresolved: number }>;
  };
  timeline: Array<{
    date: string;
    label: string;
    resources: number;
    users: number;
    comments: number;
    views: number;
  }>;
  byCategory: Array<{ name: string; count: number }>;
  byMediaType: Array<{ mediaType: string; count: number }>;
  byRole: Array<{ role: string; count: number }>;
  byRegion: Array<{ region: string; resources: number; views: number }>;
  topViewed: Array<{ id: string; title: string; category: string | null; author: string; count: number }>;
  topFavorited: Array<{ id: string; title: string; category: string | null; author: string; count: number }>;
  contributors: Array<{ id: string; name: string; count: number }>;
  options: {
    categories: Array<{ id: string; name: string }>;
    regions: string[];
  };
}

const PERIOD_LABELS: Record<AdminStatsPeriod, string> = {
  all: "Toutes les données",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  "12m": "12 derniers mois",
};

const REPORT_REASONS = ["harassment", "spam", "misinformation", "inappropriate", "other"];

export function parseAdminStatsFilters(values: Record<string, string | null | undefined>): AdminStatsFilters {
  const period = ADMIN_STATS_PERIODS.includes(values.period as AdminStatsPeriod)
    ? values.period as AdminStatsPeriod
    : "all";
  const mediaType = ADMIN_STATS_MEDIA_TYPES.includes(values.mediaType as AdminStatsMediaType)
    ? values.mediaType as AdminStatsMediaType
    : "all";
  return {
    period,
    mediaType,
    categoryId: values.categoryId && values.categoryId !== "all" ? values.categoryId : "all",
    region: values.region && values.region !== "all" ? values.region : "all",
  };
}

function periodStart(period: AdminStatsPeriod, now: Date) {
  const durations: Partial<Record<AdminStatsPeriod, number>> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "12m": 365,
  };
  const days = durations[period];
  return days ? new Date(now.getTime() - days * 86_400_000) : null;
}

function dimensions(filters: AdminStatsFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.mediaType !== "all") conditions.push(eq(resource.mediaType, filters.mediaType));
  if (filters.categoryId !== "all") conditions.push(eq(resource.categoryId, filters.categoryId));
  if (filters.region !== "all") conditions.push(eq(resource.region, filters.region));
  return conditions;
}

function where(conditions: SQL[]) {
  return conditions.length > 0 ? and(...conditions) : undefined;
}

function number(value: unknown) {
  return Number(value) || 0;
}

function bucketStart(date: Date, grain: "day" | "week") {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  if (grain === "week") {
    const day = value.getUTCDay() || 7;
    value.setUTCDate(value.getUTCDate() - day + 1);
  }
  return value;
}

function bucketKey(value: unknown, grain: "day" | "week") {
  return bucketStart(new Date(String(value)), grain).toISOString().slice(0, 10);
}

function buildTimeline(
  resourceRows: Array<{ bucket: unknown; resources: unknown; views: unknown }>,
  userRows: Array<{ bucket: unknown; users: unknown }>,
  commentRows: Array<{ bucket: unknown; comments: unknown }>,
  requestedStart: Date | null,
  now: Date,
  grain: "day" | "week",
) {
  const maps = {
    resources: new Map(resourceRows.map((row) => [bucketKey(row.bucket, grain), number(row.resources)])),
    views: new Map(resourceRows.map((row) => [bucketKey(row.bucket, grain), number(row.views)])),
    users: new Map(userRows.map((row) => [bucketKey(row.bucket, grain), number(row.users)])),
    comments: new Map(commentRows.map((row) => [bucketKey(row.bucket, grain), number(row.comments)])),
  };
  const observed = [...maps.resources.keys(), ...maps.users.keys(), ...maps.comments.keys()].sort();
  const fallback = new Date(now.getTime() - 29 * 86_400_000);
  const start = bucketStart(requestedStart ?? (observed[0] ? new Date(observed[0]) : fallback), grain);
  const end = bucketStart(now, grain);
  const formatter = new Intl.DateTimeFormat("fr-FR", grain === "day"
    ? { day: "2-digit", month: "short", timeZone: "UTC" }
    : { day: "2-digit", month: "short", year: "2-digit", timeZone: "UTC" });
  const rows = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    rows.push({
      date: key,
      label: formatter.format(cursor),
      resources: maps.resources.get(key) ?? 0,
      users: maps.users.get(key) ?? 0,
      comments: maps.comments.get(key) ?? 0,
      views: maps.views.get(key) ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + (grain === "day" ? 1 : 7));
  }
  return rows;
}

export async function getAdminStats(filters: AdminStatsFilters): Promise<AdminStats> {
  const now = new Date();
  const start = periodStart(filters.period, now);
  const grain = filters.period === "7d" || filters.period === "30d" ? "day" as const : "week" as const;
  const dimensionConditions = dimensions(filters);
  const resourceConditions = [...dimensionConditions, ...(start ? [gte(resource.createdAt, start)] : [])];
  const publishedConditions = [...resourceConditions, eq(resource.status, "published")];
  const interactionDimensions = dimensions(filters);
  const hasDimensions = interactionDimensions.length > 0;
  const bucketExpression = (column: typeof resource.createdAt | typeof user.createdAt | typeof comment.createdAt) =>
    sql`date_trunc(${grain}, ${column})`;

  const usersMetricPromise = hasDimensions
    ? db.select({ value: countDistinct(user.id) }).from(user).innerJoin(resource, eq(resource.authorId, user.id)).where(where([
        ...interactionDimensions,
        ...(start ? [gte(user.createdAt, start)] : []),
      ]))
    : db.select({ value: count() }).from(user).where(start ? gte(user.createdAt, start) : undefined);

  const roleStatsPromise = hasDimensions
    ? db.select({ role: user.role, count: countDistinct(user.id) }).from(user).innerJoin(resource, eq(resource.authorId, user.id))
        .where(where([...interactionDimensions, ...(start ? [gte(user.createdAt, start)] : [])])).groupBy(user.role)
    : db.select({ role: user.role, count: count() }).from(user).where(start ? gte(user.createdAt, start) : undefined).groupBy(user.role);

  const usersTimelinePromise = hasDimensions
    ? db.select({ bucket: bucketExpression(user.createdAt), users: countDistinct(user.id) }).from(user)
        .innerJoin(resource, eq(resource.authorId, user.id))
        .where(where([...interactionDimensions, ...(start ? [gte(user.createdAt, start)] : [])]))
        .groupBy(bucketExpression(user.createdAt)).orderBy(bucketExpression(user.createdAt))
    : db.select({ bucket: bucketExpression(user.createdAt), users: count() }).from(user)
        .where(start ? gte(user.createdAt, start) : undefined)
        .groupBy(bucketExpression(user.createdAt)).orderBy(bucketExpression(user.createdAt));

  const reportJoin = db.select({
    reason: report.reason,
    resolved: report.resolved,
    count: count(),
  }).from(report)
    .leftJoin(comment, eq(report.commentId, comment.id))
    .leftJoin(resource, or(eq(report.resourceId, resource.id), eq(comment.resourceId, resource.id)))
    .where(where([...interactionDimensions, ...(start ? [gte(report.createdAt, start)] : [])]))
    .groupBy(report.reason, report.resolved);

  const [
    [{ value: totalUsers }],
    [{ value: totalResources }],
    [{ value: totalViews }],
    [{ value: pendingResources }],
    [{ value: publishedResources }],
    [{ value: totalComments }],
    [{ value: hiddenComments }],
    [{ value: favoritesCount }],
    [{ value: completionsCount }],
    [{ value: savedCount }],
    [{ value: averagePublicationHours }],
    categoryStats,
    mediaTypeStats,
    roleStats,
    regionStats,
    reportRows,
    resourceTimeline,
    usersTimeline,
    commentsTimeline,
    topViewed,
    topFavorited,
    contributors,
    allCategories,
    allRegions,
  ] = await Promise.all([
    usersMetricPromise,
    db.select({ value: count() }).from(resource).where(where(resourceConditions)),
    db.select({ value: sum(resource.viewCount) }).from(resource).where(where(resourceConditions)),
    db.select({ value: count() }).from(resource).where(where([...resourceConditions, eq(resource.status, "pending")])),
    db.select({ value: count() }).from(resource).where(where(publishedConditions)),
    db.select({ value: count() }).from(comment).innerJoin(resource, eq(comment.resourceId, resource.id))
      .where(where([...interactionDimensions, ...(start ? [gte(comment.createdAt, start)] : [])])),
    db.select({ value: count() }).from(comment).innerJoin(resource, eq(comment.resourceId, resource.id))
      .where(where([...interactionDimensions, eq(comment.status, "hidden"), ...(start ? [gte(comment.createdAt, start)] : [])])),
    db.select({ value: count() }).from(favorite).innerJoin(resource, eq(favorite.resourceId, resource.id))
      .where(where([...interactionDimensions, ...(start ? [gte(favorite.createdAt, start)] : [])])),
    db.select({ value: count() }).from(completion).innerJoin(resource, eq(completion.resourceId, resource.id))
      .where(where([...interactionDimensions, ...(start ? [gte(completion.createdAt, start)] : [])])),
    db.select({ value: count() }).from(savedResource).innerJoin(resource, eq(savedResource.resourceId, resource.id))
      .where(where([...interactionDimensions, ...(start ? [gte(savedResource.createdAt, start)] : [])])),
    db.select({ value: sql<number>`coalesce(avg(extract(epoch from (${resource.updatedAt} - ${resource.createdAt})) / 3600), 0)` })
      .from(resource).where(where(publishedConditions)),
    db.select({ name: category.name, count: count() }).from(resource).innerJoin(category, eq(resource.categoryId, category.id))
      .where(where(publishedConditions)).groupBy(category.name).orderBy(desc(count())),
    db.select({ mediaType: resource.mediaType, count: count() }).from(resource)
      .where(where(publishedConditions)).groupBy(resource.mediaType).orderBy(desc(count())),
    roleStatsPromise,
    db.select({ region: resource.region, resources: count(), views: sum(resource.viewCount) }).from(resource)
      .where(where([...publishedConditions, sql`${resource.region} is not null`, sql`${resource.region} != ''`]))
      .groupBy(resource.region).orderBy(desc(count())),
    reportJoin,
    db.select({ bucket: bucketExpression(resource.createdAt), resources: count(), views: sum(resource.viewCount) }).from(resource)
      .where(where(resourceConditions)).groupBy(bucketExpression(resource.createdAt)).orderBy(bucketExpression(resource.createdAt)),
    usersTimelinePromise,
    db.select({ bucket: bucketExpression(comment.createdAt), comments: count() }).from(comment)
      .innerJoin(resource, eq(comment.resourceId, resource.id))
      .where(where([...interactionDimensions, ...(start ? [gte(comment.createdAt, start)] : [])]))
      .groupBy(bucketExpression(comment.createdAt)).orderBy(bucketExpression(comment.createdAt)),
    db.select({ id: resource.id, title: resource.title, category: category.name, author: user.name, count: resource.viewCount })
      .from(resource).leftJoin(category, eq(resource.categoryId, category.id)).innerJoin(user, eq(resource.authorId, user.id))
      .where(where(publishedConditions)).orderBy(desc(resource.viewCount)).limit(10),
    db.select({ id: resource.id, title: resource.title, category: category.name, author: user.name, count: count() })
      .from(favorite).innerJoin(resource, eq(favorite.resourceId, resource.id)).leftJoin(category, eq(resource.categoryId, category.id))
      .innerJoin(user, eq(resource.authorId, user.id))
      .where(where([...interactionDimensions, eq(resource.status, "published"), ...(start ? [gte(favorite.createdAt, start)] : [])]))
      .groupBy(resource.id, resource.title, category.name, user.name).orderBy(desc(count())).limit(10),
    db.select({ id: user.id, name: user.name, count: count() }).from(resource).innerJoin(user, eq(resource.authorId, user.id))
      .where(where([...publishedConditions, eq(user.role, "citizen")])).groupBy(user.id, user.name).orderBy(desc(count())).limit(10),
    db.select({ id: category.id, name: category.name }).from(category).orderBy(category.name),
    db.selectDistinct({ region: resource.region }).from(resource)
      .where(and(sql`${resource.region} is not null`, sql`${resource.region} != ''`)).orderBy(resource.region),
  ]);

  const reportsByReason = REPORT_REASONS.map((reason) => {
    const rows = reportRows.filter((row) => row.reason === reason);
    return {
      reason,
      resolved: rows.filter((row) => row.resolved).reduce((total, row) => total + number(row.count), 0),
      unresolved: rows.filter((row) => !row.resolved).reduce((total, row) => total + number(row.count), 0),
    };
  });
  const totalReports = reportsByReason.reduce((total, item) => total + item.resolved + item.unresolved, 0);
  const resolvedReports = reportsByReason.reduce((total, item) => total + item.resolved, 0);
  const published = number(publishedResources);
  const timeline = buildTimeline(resourceTimeline, usersTimeline, commentsTimeline, start, now, grain);

  return {
    filters,
    period: {
      label: PERIOD_LABELS[filters.period],
      start: timeline[0]?.date ?? bucketStart(start ?? now, grain).toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
      grain,
    },
    metrics: {
      users: number(totalUsers),
      resources: number(totalResources),
      views: number(totalViews),
      pendingResources: number(pendingResources),
      publishedResources: published,
      reports: totalReports,
      unresolvedReports: totalReports - resolvedReports,
      comments: number(totalComments),
    },
    engagement: {
      favorites: number(favoritesCount),
      completions: number(completionsCount),
      savedResources: number(savedCount),
      completionRate: published > 0 ? Math.round((number(completionsCount) / published) * 1000) / 10 : 0,
    },
    moderation: {
      averagePublicationHours: Math.round(number(averagePublicationHours) * 10) / 10,
      hiddenComments: number(hiddenComments),
      resolvedShare: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 1000) / 10 : 0,
      reportsByReason,
    },
    timeline,
    byCategory: categoryStats.map((item) => ({ name: item.name, count: number(item.count) })),
    byMediaType: mediaTypeStats.map((item) => ({ mediaType: item.mediaType, count: number(item.count) })),
    byRole: roleStats.map((item) => ({ role: item.role, count: number(item.count) })),
    byRegion: regionStats.filter((item) => item.region).map((item) => ({ region: item.region!, resources: number(item.resources), views: number(item.views) })),
    topViewed: topViewed.map((item) => ({ ...item, count: number(item.count) })),
    topFavorited: topFavorited.map((item) => ({ ...item, count: number(item.count) })),
    contributors: contributors.map((item) => ({ ...item, count: number(item.count) })),
    options: {
      categories: allCategories,
      regions: allRegions.flatMap((item) => item.region ? [item.region] : []),
    },
  };
}
