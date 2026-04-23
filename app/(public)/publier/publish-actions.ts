"use server";

import { db } from "@/db";
import { resource } from "@/db/schema";
import { getServerSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface PublishParams {
  title: string;
  content: string;
  summary: string;
  mediaType: string;
  categoryId: string | null;
  privacy: "public" | "private";
  isDraft: boolean;
  imageUrl: string | null;
}

export async function publishResource(params: PublishParams) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const { title, content, summary, mediaType, categoryId, privacy, isDraft, imageUrl } = params;

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
    mediaType: (mediaType || "article") as
      | "article"
      | "video"
      | "pdf"
      | "exercise"
      | "audio"
      | "protocol",
    privacy: privacy || "public",
    status: isDraft ? "draft" : "pending",
    categoryId: categoryId || null,
    authorId: session.user.id,
    imageUrl: imageUrl || null,
    readingTime,
  });

  revalidatePath("/catalogue");
  redirect(`/ressource/${id}`);
}

