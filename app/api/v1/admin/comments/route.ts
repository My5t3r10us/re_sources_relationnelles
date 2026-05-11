import { db } from "@/db";
import { comment, user, resource } from "@/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const statusParam = searchParams.get("status") ?? "";
    const offset = (page - 1) * limit;

    const filters = [];
    if (statusParam) filters.push(eq(comment.status, statusParam as never));
    const where = filters.length ? and(...filters) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(comment).where(where);

    const rows = await db
      .select({
        id: comment.id,
        content: comment.content,
        status: comment.status,
        likes: comment.likes,
        createdAt: comment.createdAt,
        resourceId: comment.resourceId,
        resourceTitle: resource.title,
        authorId: comment.authorId,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .leftJoin(resource, eq(comment.resourceId, resource.id))
      .where(where)
      .orderBy(desc(comment.createdAt))
      .limit(limit)
      .offset(offset);

    return apiSuccess(rows, { page, limit, total: Number(total) });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
