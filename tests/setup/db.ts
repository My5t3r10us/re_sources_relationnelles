import { db } from "@/db";
import {
  user,
  account,
  session,
  category,
  resource,
  resourceFile,
  comment,
  commentLike,
  favorite,
  completion,
  savedResource,
  report,
  resourceSession,
  sessionParticipant,
  sessionMessage,
} from "@/db/schema";
import { getTableName, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

const TABLES_IN_TRUNCATION_ORDER = [
  sessionMessage,
  sessionParticipant,
  resourceSession,
  report,
  savedResource,
  completion,
  favorite,
  commentLike,
  comment,
  resourceFile,
  resource,
  category,
  session,
  account,
  user,
];

export async function resetDb() {
  // Single TRUNCATE so PostgreSQL handles FK dependencies in one shot via CASCADE +
  // RESTART IDENTITY. Cheaper than one TRUNCATE per table.
  const names = TABLES_IN_TRUNCATION_ORDER.map((t) => `"${getTableName(t)}"`).join(", ");
  await db.execute(sql.raw(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`));
}

export type TestUserRole = "citizen" | "moderator" | "admin" | "super_admin";

export interface CreatedTestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: TestUserRole;
  token: string;
}

export async function createTestUser(opts?: Partial<{
  email: string;
  name: string;
  password: string;
  role: TestUserRole;
  active: boolean;
}>): Promise<CreatedTestUser> {
  const id = crypto.randomUUID();
  const email = opts?.email ?? `user-${id.slice(0, 8)}@test.local`;
  const password = opts?.password ?? "Password123!";
  const name = opts?.name ?? "Test User";
  const role: TestUserRole = opts?.role ?? "citizen";
  const active = opts?.active ?? true;

  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    role,
    active,
  });

  const hashed = await hashPassword(password);
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: hashed,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.insert(session).values({
    id: crypto.randomUUID(),
    expiresAt,
    token,
    userId: id,
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
  });

  return { id, email, password, name, role, token };
}

export async function createTestCategory(opts?: Partial<{ name: string; slug: string; icon: string }>) {
  const id = crypto.randomUUID();
  const slug = opts?.slug ?? `cat-${id.slice(0, 6)}`;
  const name = opts?.name ?? `Cat ${slug}`;
  const [row] = await db
    .insert(category)
    .values({ id, name, slug, icon: opts?.icon ?? "📁" })
    .returning();
  return row;
}

export async function createTestResource(opts: {
  authorId: string;
  categoryId?: string | null;
  status?: "draft" | "pending" | "published" | "rejected" | "flagged";
  privacy?: "public" | "private";
  featured?: boolean;
  title?: string;
  content?: string;
  summary?: string;
  mediaType?: "article" | "video" | "pdf" | "exercise" | "audio" | "protocol";
}) {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(resource)
    .values({
      id,
      title: opts.title ?? `Test resource ${id.slice(0, 6)}`,
      content: opts.content ?? "Contenu de test avec plusieurs mots pour calculer le temps de lecture.",
      summary: opts.summary ?? "Résumé de test",
      mediaType: opts.mediaType ?? "article",
      privacy: opts.privacy ?? "public",
      status: opts.status ?? "published",
      categoryId: opts.categoryId ?? null,
      authorId: opts.authorId,
      readingTime: 1,
      featured: opts.featured ?? false,
    })
    .returning();
  return row;
}

export async function createTestComment(opts: {
  resourceId: string;
  authorId: string;
  content?: string;
  parentId?: string | null;
}) {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(comment)
    .values({
      id,
      content: opts.content ?? "Commentaire de test",
      resourceId: opts.resourceId,
      authorId: opts.authorId,
      parentId: opts.parentId ?? null,
    })
    .returning();
  return row;
}

export async function withAuthHeaders(token: string): Promise<HeadersInit> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
