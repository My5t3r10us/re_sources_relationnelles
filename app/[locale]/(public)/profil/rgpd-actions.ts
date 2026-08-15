"use server";

import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { account } from "@/db/schema";
import { requireUser } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/audit-log";
import { deleteUserAccount, exportUserData } from "@/lib/rgpd";
import { accountDeletionSchema, parseOrThrow } from "@/lib/validation";

/**
 * Droits RGPD exercés par le citoyen depuis son profil.
 *
 * Chaque fonction exportée d'un fichier `"use server"` est une route HTTP
 * réelle : les arguments arrivent du réseau et passent donc par un schéma Zod
 * (`lib/validation.ts`), jamais par la seule garantie du typage TypeScript.
 */

/** Export des données personnelles au format JSON (art. 20). */
export async function exportMyData(): Promise<string> {
  const actor = await requireUser();

  const data = await exportUserData(actor.id);

  await logAdminAction({
    actorId: actor.id,
    event: "user.data_exported",
    targetType: "user",
    targetId: actor.id,
  });

  return JSON.stringify(data, null, 2);
}

/**
 * Suppression définitive du compte (art. 17).
 *
 * Le mot de passe est revérifié ici, comme le fait déjà la désactivation de la
 * double authentification : la session seule ne suffit pas à autoriser une
 * action irréversible.
 */
export async function deleteMyAccount(input: {
  password: string;
  confirmation: string;
}): Promise<void> {
  const actor = await requireUser();
  const { password } = parseOrThrow(accountDeletionSchema, input);

  const [credentials] = await db
    .select({ password: account.password })
    .from(account)
    .where(
      and(eq(account.userId, actor.id), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (!credentials?.password) {
    throw new Error(
      "Ce compte n'a pas de mot de passe : contactez le support pour en demander la suppression",
    );
  }

  const { verifyPassword } = await import("better-auth/crypto");
  const valide = await verifyPassword({
    hash: credentials.password,
    password,
  });
  if (!valide) throw new Error("Mot de passe incorrect");

  // Journalisé AVANT la suppression : `auth_log.user_id` est mis à NULL par
  // l'effacement, or la trace de l'opération doit rester exploitable — d'où
  // l'identifiant conservé en `targetId`, qui ne désigne plus aucun compte
  // existant une fois la suppression faite.
  await logAdminAction({
    actorId: actor.id,
    event: "user.self_deleted",
    targetType: "user",
    targetId: actor.id,
  });

  const rapport = await deleteUserAccount(actor.id);
  console.log(
    `[rgpd] compte supprimé : ${rapport.ressourcesAnonymisees} ressource(s) et ` +
      `${rapport.commentairesAnonymises} commentaire(s) anonymisés, ` +
      `${rapport.fichiersSupprimes} fichier(s) supprimés.`,
  );

  revalidatePath("/", "layout");
  redirect("/");
}
