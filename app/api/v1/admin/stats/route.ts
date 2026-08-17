import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";
import { getAdminStats, parseAdminStatsFilters } from "@/lib/admin-stats";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);

    const url = new URL(req.url);
    const filters = parseAdminStatsFilters({
      period: url.searchParams.get("period"),
      mediaType: url.searchParams.get("mediaType"),
      categoryId: url.searchParams.get("categoryId"),
      region: url.searchParams.get("region"),
    });
    return apiSuccess(await getAdminStats(filters));
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
