import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiError } from "@/lib/api-response";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: "citizen" | "moderator" | "admin" | "super_admin";
  active: boolean;
};

export async function getApiSession(req: Request): Promise<ApiUser | null> {
  const session = await auth.api.getSession({ headers: req.headers as never });
  if (!session?.user) return null;

  const [dbUser] = await db
    .select({ id: user.id, email: user.email, name: user.name, role: user.role, active: user.active })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || !dbUser.active) return null;
  return dbUser as ApiUser;
}

export async function requireApiAuth(req: Request): Promise<ApiUser> {
  const u = await getApiSession(req);
  if (!u) throw apiError("UNAUTHORIZED", "Non authentifié", 401);
  return u;
}

export async function requireApiAdmin(req: Request): Promise<ApiUser> {
  const u = await requireApiAuth(req);
  if (u.role !== "admin" && u.role !== "super_admin") {
    throw apiError("FORBIDDEN", "Accès réservé aux administrateurs", 403);
  }
  return u;
}

export async function requireApiSuperAdmin(req: Request): Promise<ApiUser> {
  const u = await requireApiAuth(req);
  if (u.role !== "super_admin") {
    throw apiError("FORBIDDEN", "Accès réservé au super-administrateur", 403);
  }
  return u;
}
