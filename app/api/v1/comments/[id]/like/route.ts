import { db } from "@/db";
import { comment, commentLike } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { id: commentId } = await params;
    const currentUser = await requireApiAuth(req);

    const [existing] = await db
      .select({ id: commentLike.id })
      .from(commentLike)
      .where(and(eq(commentLike.userId, currentUser.id), eq(commentLike.commentId, commentId)))
      .limit(1);

    if (existing) {
      await db.delete(commentLike).where(eq(commentLike.id, existing.id));
      await db.update(comment).set({ likes: sql`GREATEST(${comment.likes} - 1, 0)` }).where(eq(comment.id, commentId));
    } else {
      await db.insert(commentLike).values({ id: crypto.randomUUID(), userId: currentUser.id, commentId });
      await db.update(comment).set({ likes: sql`${comment.likes} + 1` }).where(eq(comment.id, commentId));
    }

    return apiSuccess({ liked: !existing });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
