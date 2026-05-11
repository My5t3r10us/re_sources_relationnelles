import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);

    const [profile] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    return apiSuccess(profile);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);
    const body = await req.json();
    const { firstName, lastName, name, image } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (image !== undefined) updates.image = image;

    await db.update(user).set(updates).where(eq(user.id, currentUser.id));

    const [updated] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    return apiSuccess(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
