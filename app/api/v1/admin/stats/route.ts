import { db } from "@/db";
import { resource, user, comment, report } from "@/db/schema";
import { eq, count, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);

    const [[{ totalResources }], [{ publishedResources }], [{ pendingResources }], [{ totalUsers }], [{ totalComments }], [{ pendingReports }]] =
      await Promise.all([
        db.select({ totalResources: count() }).from(resource),
        db.select({ publishedResources: count() }).from(resource).where(eq(resource.status, "published")),
        db.select({ pendingResources: count() }).from(resource).where(eq(resource.status, "pending")),
        db.select({ totalUsers: count() }).from(user),
        db.select({ totalComments: count() }).from(comment),
        db.select({ pendingReports: count() }).from(report).where(eq(report.resolved, false)),
      ]);

    return apiSuccess({
      resources: {
        total: Number(totalResources),
        published: Number(publishedResources),
        pending: Number(pendingResources),
      },
      users: { total: Number(totalUsers) },
      comments: { total: Number(totalComments) },
      reports: { pending: Number(pendingReports) },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
