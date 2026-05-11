import { db } from "@/db";
import { report } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireApiAdmin(req);
    const { id } = await params;

    const [existing] = await db.select({ id: report.id }).from(report).where(eq(report.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Signalement introuvable", 404);

    await db.update(report).set({ resolved: true }).where(eq(report.id, id));
    return apiSuccess({ id, resolved: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
