import { db } from "@/db";
import { resource, resourceFile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";
import { deleteObject, getObjectKeyFromUrl } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireApiAdmin(req);
    const { id } = await params;

    const [existing] = await db
      .select({ id: resource.id, imageUrl: resource.imageUrl })
      .from(resource)
      .where(eq(resource.id, id))
      .limit(1);
    if (!existing) return apiError("NOT_FOUND", "Ressource introuvable", 404);

    const files = await db
      .select({ url: resourceFile.url })
      .from(resourceFile)
      .where(eq(resourceFile.resourceId, id));

    await db.delete(resource).where(eq(resource.id, id));

    const urlsToDelete = [
      ...(existing.imageUrl ? [existing.imageUrl] : []),
      ...files.map((f) => f.url),
    ];
    await Promise.allSettled(
      urlsToDelete.map((url) => {
        const key = getObjectKeyFromUrl(url);
        return key ? deleteObject(key) : Promise.resolve();
      })
    );

    return apiSuccess({ deleted: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
