import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin, requireApiSuperAdmin } from "@/lib/api-auth";
import { createAdminUserCore } from "@/lib/admin-user";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const offset = (page - 1) * limit;

    const [{ total }] = await db.select({ total: count() }).from(user);

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return apiSuccess(rows, { page, limit, total: Number(total) });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireApiSuperAdmin(req);
    const body = await req.json();
    const result = await createAdminUserCore(body);
    if ("error" in result) {
      const status = result.error.code === "EMAIL_TAKEN" ? 409 : 400;
      return apiError(result.error.code, result.error.message, status);
    }

    const [created] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, result.id))
      .limit(1);

    return apiSuccess(created, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
