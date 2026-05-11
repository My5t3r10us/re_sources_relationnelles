import { db } from "@/db";
import { report, user, resource, comment } from "@/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const resolvedParam = searchParams.get("resolved") ?? "";
    const offset = (page - 1) * limit;

    const filters = [];
    if (resolvedParam === "true") filters.push(eq(report.resolved, true));
    if (resolvedParam === "false") filters.push(eq(report.resolved, false));
    const where = filters.length ? and(...filters) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(report).where(where);

    const rows = await db
      .select({
        id: report.id,
        reason: report.reason,
        description: report.description,
        resolved: report.resolved,
        createdAt: report.createdAt,
        resourceId: report.resourceId,
        resourceTitle: resource.title,
        commentId: report.commentId,
        reporterId: report.reporterId,
        reporterName: user.name,
        reporterEmail: user.email,
      })
      .from(report)
      .leftJoin(user, eq(report.reporterId, user.id))
      .leftJoin(resource, eq(report.resourceId, resource.id))
      .where(where)
      .orderBy(desc(report.createdAt))
      .limit(limit)
      .offset(offset);

    return apiSuccess(rows, { page, limit, total: Number(total) });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
