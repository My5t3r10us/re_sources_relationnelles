import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "citizen" | "moderator" | "admin" | "super_admin";

/**
 * Utilisateur dont l'identité ET l'état ont été revalidés en base.
 *
 * `role` et `active` sont TOUJOURS relus depuis la base, jamais lus dans le
 * cookie de session : un rôle modifié ou un compte désactivé prend effet
 * immédiatement, sans attendre l'expiration de la session.
 */
export type VerifiedUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  active: boolean;
};

/**
 * Source de vérité unique pour la session, partagée par les deux surfaces de
 * l'application : l'API REST (`lib/api-auth.ts`) et le web — Server Actions et
 * pages (`lib/auth-server.ts`).
 *
 * Historiquement ces deux surfaces avaient chacune leur propre logique, et
 * seule celle de l'API vérifiait `active`. Un compte désactivé conservait donc
 * tous ses droits sur le web, panneau d'administration compris. Toute
 * vérification de session doit désormais passer par ici.
 */
export async function loadVerifiedUser(headers: Headers): Promise<VerifiedUser | null> {
  const session = await auth.api.getSession({ headers: headers as never });
  if (!session?.user) return null;

  const [dbUser] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      active: user.active,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || !dbUser.active) return null;
  return dbUser as VerifiedUser;
}
