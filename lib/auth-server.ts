import { headers } from "next/headers";
import { loadVerifiedUser, type VerifiedUser } from "@/lib/session-user";
import { isAdminRole } from "@/lib/authz";

export type ServerSession = { user: VerifiedUser };

/**
 * Session du côté web : Server Actions et pages.
 *
 * Retourne `null` si le compte est désactivé, et expose un `role` relu en base
 * plutôt que celui du cookie. La forme `{ user }` est conservée telle quelle
 * pour rester compatible avec les sites d'appel existants.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const user = await loadVerifiedUser(await headers());
  return user ? { user } : null;
}

/** Garde d'authentification pour Server Action. Lève si non connecté. */
export async function requireUser(): Promise<VerifiedUser> {
  const session = await getServerSession();
  if (!session) throw new Error("Non authentifié");
  return session.user;
}

/** Garde administrateur (admin ou super_admin) pour Server Action. */
export async function requireAdmin(): Promise<VerifiedUser> {
  const user = await requireUser();
  if (!isAdminRole(user.role)) throw new Error("Accès refusé");
  return user;
}

/** Garde super-administrateur pour Server Action. */
export async function requireSuperAdmin(): Promise<VerifiedUser> {
  const user = await requireUser();
  if (user.role !== "super_admin") {
    throw new Error("Accès réservé au super-administrateur");
  }
  return user;
}
