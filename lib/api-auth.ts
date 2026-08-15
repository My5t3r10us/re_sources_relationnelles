import { apiError } from "@/lib/api-response";
import { loadVerifiedUser, type UserRole, type VerifiedUser } from "@/lib/session-user";
import { isAdminRole } from "@/lib/authz";

export type { UserRole };

/** Conservé pour compatibilité : identique à `VerifiedUser`. */
export type ApiUser = VerifiedUser;

export async function getApiSession(req: Request): Promise<ApiUser | null> {
  return loadVerifiedUser(req.headers);
}

export async function requireApiAuth(req: Request): Promise<ApiUser> {
  const u = await getApiSession(req);
  if (!u) throw apiError("UNAUTHORIZED", "Non authentifié", 401);
  return u;
}

export async function requireApiAdmin(req: Request): Promise<ApiUser> {
  const u = await requireApiAuth(req);
  if (!isAdminRole(u.role)) {
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
