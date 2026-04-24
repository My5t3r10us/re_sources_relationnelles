import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { resource, favorite, completion, savedResource, category, user } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { BookOpen, Heart, BookmarkCheck, CheckCircle2 } from "lucide-react";

const mediaTypeLabels: Record<string, string> = {
  article: "Article",
  video: "Vidéo",
  pdf: "PDF",
  exercise: "Exercice",
  audio: "Audio",
  protocol: "Protocole",
};

export default async function TableauDeBordPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [dbUser] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const firstName = dbUser?.name?.split(" ")[0] ?? "vous";

  const [
    favoritedResources,
    completedResources,
    savedResources,
    [{ myResourceCount }],
  ] = await Promise.all([
    db
      .select({
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        categoryName: category.name,
        imageUrl: resource.imageUrl,
      })
      .from(favorite)
      .innerJoin(resource, eq(favorite.resourceId, resource.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(favorite.userId, userId))
      .orderBy(desc(favorite.createdAt))
      .limit(6),
    db
      .select({
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        categoryName: category.name,
        imageUrl: resource.imageUrl,
      })
      .from(completion)
      .innerJoin(resource, eq(completion.resourceId, resource.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(completion.userId, userId))
      .orderBy(desc(completion.createdAt))
      .limit(6),
    db
      .select({
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        categoryName: category.name,
        imageUrl: resource.imageUrl,
      })
      .from(savedResource)
      .innerJoin(resource, eq(savedResource.resourceId, resource.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(savedResource.userId, userId))
      .orderBy(desc(savedResource.createdAt))
      .limit(6),
    db
      .select({ myResourceCount: count() })
      .from(resource)
      .where(and(eq(resource.authorId, userId), eq(resource.status, "published"))),
  ]);

  const totalCompletions = completedResources.length;
  const totalFavorites = favoritedResources.length;
  const totalSaved = savedResources.length;

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-display-lg text-on-surface mb-2">
            Bonjour, {firstName}.
          </h1>
          <p className="text-lg text-on-surface-variant mb-10">
            Vous avez exploité <strong>{totalCompletions}</strong> ressource{totalCompletions !== 1 ? "s" : ""},{" "}
            <strong>{totalFavorites}</strong> en favoris et{" "}
            <strong>{totalSaved}</strong> mise{totalSaved !== 1 ? "s" : ""} de côté.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Exploitées", value: totalCompletions, icon: <CheckCircle2 className="w-5 h-5 text-tertiary" /> },
              { label: "Favoris", value: totalFavorites, icon: <Heart className="w-5 h-5 text-primary" /> },
              { label: "Mises de côté", value: totalSaved, icon: <BookmarkCheck className="w-5 h-5 text-secondary" /> },
              { label: "Publiées", value: myResourceCount, icon: <BookOpen className="w-5 h-5 text-on-surface-variant" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5 flex items-center gap-4">
                {stat.icon}
                <div>
                  <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
                  <p className="text-xs text-on-surface-variant">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* My Resources link */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm flex items-center justify-between mb-8">
            <div>
              <p className="font-semibold text-on-surface">Mes ressources publiées &amp; brouillons</p>
              <p className="text-sm text-on-surface-variant">Gérez vos contributions, brouillons et contenus privés.</p>
            </div>
            <Link href="/mes-ressources" className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2 text-sm font-semibold whitespace-nowrap">
              Gérer mes ressources
            </Link>
          </div>

          {/* Saved for later */}
          {savedResources.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-headline-md text-on-surface">Mises de côté</h2>
                <Link href="/catalogue" className="text-sm font-semibold text-primary hover:underline">Découvrir plus</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedResources.map((res) => <ResourceCard key={res.id} resource={res} />)}
              </div>
            </section>
          )}

          {/* Favorites */}
          {favoritedResources.length > 0 && (
            <section className="mb-12">
              <h2 className="text-headline-md text-on-surface mb-6">Mes favoris</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {favoritedResources.map((res) => <ResourceCard key={res.id} resource={res} />)}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedResources.length > 0 && (
            <section className="mb-12">
              <h2 className="text-headline-md text-on-surface mb-6">Ressources exploitées</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {completedResources.map((res) => <ResourceCard key={res.id} resource={res} />)}
              </div>
            </section>
          )}

          {totalCompletions === 0 && totalFavorites === 0 && totalSaved === 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-16 text-center shadow-ambient-sm">
              <p className="text-on-surface-variant text-lg mb-4">
                Vous n&apos;avez pas encore interagi avec des ressources.
              </p>
              <Link href="/catalogue" className="gradient-primary text-on-primary-fixed rounded-xl px-8 py-3 text-sm font-semibold inline-block">
                Explorer le catalogue
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ResourceCard({
  resource: res,
}: {
  resource: {
    id: string;
    title: string;
    summary: string | null;
    mediaType: string;
    categoryName: string | null;
    imageUrl?: string | null;
  };
}) {
  return (
    <Link href={`/ressource/${res.id}`} className="group">
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
        {res.imageUrl ? (
          <img src={res.imageUrl} alt={res.title} className="aspect-4/3 w-full object-cover" />
        ) : (
          <div className="aspect-4/3 bg-surface-container-high" />
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {res.categoryName && <Badge variant="outline">{res.categoryName}</Badge>}
            <Badge variant="secondary">{mediaTypeLabels[res.mediaType] ?? res.mediaType}</Badge>
          </div>
          <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {res.title}
          </h3>
          {res.summary && <p className="text-sm text-on-surface-variant line-clamp-2">{res.summary}</p>}
        </div>
      </div>
    </Link>
  );
}