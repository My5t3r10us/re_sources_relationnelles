import { db } from "@/db";
import { user, account } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin, requireApiSuperAdmin } from "@/lib/api-auth";

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
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return apiError("VALIDATION_ERROR", "Tous les champs sont requis", 400);
    }

    const validRoles = ["moderator", "admin", "super_admin"];
    if (!validRoles.includes(role)) {
      return apiError("VALIDATION_ERROR", "Rôle invalide", 400);
    }

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    if (existing) return apiError("CONFLICT", "Cet email est déjà utilisé", 409);

    const { hashPassword } = await import("better-auth/crypto");
    const hashedPassword = await hashPassword(password);

    const userId = crypto.randomUUID();
    await db.insert(user).values({ id: userId, name, email, emailVerified: true, role, active: true });
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [created] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return apiSuccess(created, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
