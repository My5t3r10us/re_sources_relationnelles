import { db } from "@/db";
import { category } from "@/db/schema";
import { asc } from "drizzle-orm";
import { apiSuccess } from "@/lib/api-response";

export async function GET() {
  const categories = await db
    .select()
    .from(category)
    .orderBy(asc(category.name));

  return apiSuccess(categories);
}
