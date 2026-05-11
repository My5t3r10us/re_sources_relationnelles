"use server";

import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { resource, category } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { EditResourceClient } from "./edit-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModifierRessourcePage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const [res] = await db
    .select({
      id: resource.id,
      title: resource.title,
      content: resource.content,
      mediaType: resource.mediaType,
      privacy: resource.privacy,
      categoryId: resource.categoryId,
      imageUrl: resource.imageUrl,
      authorId: resource.authorId,
      status: resource.status,
    })
    .from(resource)
    .where(eq(resource.id, id))
    .limit(1);

  if (!res) notFound();
  if (res.authorId !== session.user.id) redirect(`/ressource/${id}`);

  const categories = await db
    .select({ id: category.id, name: category.name, slug: category.slug })
    .from(category)
    .orderBy(category.name);

  return (
    <EditResourceClient
      resource={res}
      categories={categories}
    />
  );
}
