import { db } from "@/db";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role: "moderator" | "admin" | "super_admin";
}

export type CreateAdminUserError =
  | { code: "INVALID_INPUT"; message: string }
  | { code: "EMAIL_TAKEN"; message: string };

export async function createAdminUserCore(
  input: CreateAdminUserInput
): Promise<{ id: string } | { error: CreateAdminUserError }> {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password;
  const role = input.role;

  if (!name || !email || !password) {
    return { error: { code: "INVALID_INPUT", message: "Nom, email et mot de passe sont requis" } };
  }
  // Politique appliquée côté serveur : l'attribut `minLength` du formulaire ne
  // contraint que le navigateur et se contourne trivialement.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: {
        code: "INVALID_INPUT",
        message: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères`,
      },
    };
  }
  if (!["moderator", "admin", "super_admin"].includes(role)) {
    return { error: { code: "INVALID_INPUT", message: "Rôle invalide" } };
  }

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing) {
    return { error: { code: "EMAIL_TAKEN", message: "Cet email est déjà utilisé" } };
  }

  const { hashPassword } = await import("better-auth/crypto");
  const hashed = await hashPassword(password);

  const userId = crypto.randomUUID();
  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    role,
    active: true,
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashed,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: userId };
}
