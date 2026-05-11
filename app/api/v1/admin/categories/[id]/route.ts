import { db } from "@/db";
import { category } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireApiAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, icon } = body;

    if (!name || !slug) return apiError("VALIDATION_ERROR", "Le nom et le slug sont requis", 400);

    const [existing] = await db.select({ id: category.id }).from(category).where(eq(category.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Catégorie introuvable", 404);

    await db.update(category).set({ name, slug, description: description ?? null, icon: icon ?? null }).where(eq(category.id, id));

    const [updated] = await db.select().from(category).where(eq(category.id, id)).limit(1);
    return apiSuccess(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireApiAdmin(req);
    const { id } = await params;

    const [existing] = await db.select({ id: category.id }).from(category).where(eq(category.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Catégorie introuvable", 404);

    await db.delete(category).where(eq(category.id, id));
    return apiSuccess({ deleted: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
