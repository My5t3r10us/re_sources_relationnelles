import { db } from "@/db";
import { comment, user } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: resourceId } = await params;

  const comments = await db
    .select({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      status: comment.status,
      likes: comment.likes,
      createdAt: comment.createdAt,
      authorId: comment.authorId,
      authorName: user.name,
    })
    .from(comment)
    .leftJoin(user, eq(comment.authorId, user.id))
    .where(eq(comment.resourceId, resourceId))
    .orderBy(asc(comment.createdAt));

  const visible = comments.filter((c) => c.status === "visible");
  return apiSuccess(visible);
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id: resourceId } = await params;
    const currentUser = await requireApiAuth(req);
    const body = await req.json();
    const { content, parentId } = body;

    if (!content?.trim()) return apiError("VALIDATION_ERROR", "Le commentaire ne peut pas être vide", 400);
    if (content.length > 2000) return apiError("VALIDATION_ERROR", "Le commentaire est trop long (max 2000 caractères)", 400);

    const id = crypto.randomUUID();
    await db.insert(comment).values({
      id,
      content: content.trim(),
      resourceId,
      authorId: currentUser.id,
      parentId: parentId || null,
    });

    const [created] = await db
      .select({
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        status: comment.status,
        likes: comment.likes,
        createdAt: comment.createdAt,
        authorId: comment.authorId,
        authorName: user.name,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.id, id))
      .limit(1);

    return apiSuccess(created, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
