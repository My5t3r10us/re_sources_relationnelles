import { db } from "@/db";
import { report, user, resource, comment } from "@/db/schema";
import { eq, desc, count, and, isNotNull } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";
import {
  REPORT_REASON_VALUES,
  REPORT_TARGET_VALUES,
  type ReportReason,
  type ReportTarget,
} from "@/lib/report-labels";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const resolvedParam = searchParams.get("resolved") ?? "";
    const reasonParam = searchParams.get("reason") ?? "";
    const targetParam = searchParams.get("target") ?? "";
    const offset = (page - 1) * limit;

    const filters = [];
    if (resolvedParam === "true") filters.push(eq(report.resolved, true));
    if (resolvedParam === "false") filters.push(eq(report.resolved, false));
    if (REPORT_REASON_VALUES.includes(reasonParam as ReportReason)) {
      filters.push(eq(report.reason, reasonParam as ReportReason));
    }
    if (REPORT_TARGET_VALUES.includes(targetParam as ReportTarget)) {
      if (targetParam === "resource") filters.push(isNotNull(report.resourceId));
      if (targetParam === "comment") filters.push(isNotNull(report.commentId));
    }
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
        commentContent: comment.content,
        reporterId: report.reporterId,
        reporterName: user.name,
        reporterEmail: user.email,
      })
      .from(report)
      .leftJoin(user, eq(report.reporterId, user.id))
      .leftJoin(resource, eq(report.resourceId, resource.id))
      .leftJoin(comment, eq(report.commentId, comment.id))
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
