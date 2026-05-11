import { db } from "@/db";
import { category } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);
    const categories = await db.select().from(category).orderBy(asc(category.name));
    return apiSuccess(categories);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireApiAdmin(req);
    const body = await req.json();
    const { name, slug, description, icon } = body;

    if (!name || !slug) return apiError("VALIDATION_ERROR", "Le nom et le slug sont requis", 400);

    const [existing] = await db.select({ id: category.id }).from(category).where(eq(category.slug, slug)).limit(1);
    if (existing) return apiError("CONFLICT", "Ce slug est déjà utilisé", 409);

    const id = crypto.randomUUID();
    await db.insert(category).values({ id, name, slug, description: description ?? null, icon: icon ?? null });

    const [created] = await db.select().from(category).where(eq(category.id, id)).limit(1);
    return apiSuccess(created, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
