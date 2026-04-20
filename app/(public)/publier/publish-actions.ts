"use server";

import { db } from "@/db";
import { resource, category } from "@/db/schema";
import { getServerSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function publishResource(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const summary = formData.get("summary") as string;
  const mediaType = formData.get("mediaType") as string;
  const categoryId = formData.get("categoryId") as string;
  const privacy = formData.get("privacy") as string;
  const isDraft = formData.get("isDraft") === "true";

  if (!title?.trim() || !content?.trim()) {
    throw new Error("Le titre et le contenu sont requis");
  }

  const id = crypto.randomUUID();

  // Estimate reading time (words / 200 wpm)
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  await db.insert(resource).values({
    id,
    title: title.trim(),
    content,
    summary: summary?.trim() || title.trim().substring(0, 160),
    mediaType: (mediaType || "article") as "article" | "video" | "pdf" | "exercise" | "audio" | "protocol",
    privacy: (privacy || "public") as "public" | "shared" | "private",
    status: isDraft ? "draft" : "pending",
    categoryId: categoryId || null,
    authorId: session.user.id,
    readingTime,
  });

  revalidatePath("/catalogue");
  redirect(`/ressource/${id}`);
}
