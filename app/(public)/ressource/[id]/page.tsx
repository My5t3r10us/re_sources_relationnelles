import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import {
  ArrowLeft,
  Clock,
  Bookmark,
  CheckCircle,
  FileText,
  PlayCircle,
  FileDown,
  Dumbbell,
  Headphones,
  ShieldAlert,
  Eye,
  Calendar,
} from "lucide-react";
import { db } from "@/db";
import { resource, user, category, comment } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const mediaTypeLabels: Record<string, string> = {
  article: "Article",
  video: "Vidéo",
  pdf: "Document PDF",
  exercise: "Exercice",
  audio: "Audio / Podcast",
  protocol: "Protocole",
};

const mediaTypeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="w-5 h-5" />,
  video: <PlayCircle className="w-5 h-5" />,
  pdf: <FileDown className="w-5 h-5" />,
  exercise: <Dumbbell className="w-5 h-5" />,
  audio: <Headphones className="w-5 h-5" />,
  protocol: <ShieldAlert className="w-5 h-5" />,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RessourcePage({ params }: PageProps) {
  const { id } = await params;

  const [res] = await db
    .select({
      id: resource.id,
      title: resource.title,
      content: resource.content,
      summary: resource.summary,
      mediaType: resource.mediaType,
      privacy: resource.privacy,
      status: resource.status,
      imageUrl: resource.imageUrl,
      readingTime: resource.readingTime,
      viewCount: resource.viewCount,
      createdAt: resource.createdAt,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      categoryName: category.name,
      categorySlug: category.slug,
    })
    .from(resource)
    .innerJoin(user, eq(resource.authorId, user.id))
    .leftJoin(category, eq(resource.categoryId, category.id))
    .where(eq(resource.id, id))
    .limit(1);

  if (!res) notFound();

  // Increment view count
  db.update(resource)
    .set({ viewCount: res.viewCount + 1 })
    .where(eq(resource.id, id))
    .then(() => {});

  const comments = await db
    .select({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      parentId: comment.parentId,
      likes: comment.likes,
    })
    .from(comment)
    .innerJoin(user, eq(comment.authorId, user.id))
    .where(and(eq(comment.resourceId, id), eq(comment.status, "visible")))
    .orderBy(desc(comment.createdAt));

  const topLevelComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  const formattedDate = res.createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      {/* Back */}
      <Link
        href="/catalogue"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        Retour au catalogue
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {res.categoryName && (
            <Badge variant="primary">{res.categoryName}</Badge>
          )}
          <Badge variant="secondary">
            {mediaTypeIcons[res.mediaType]}
            {mediaTypeLabels[res.mediaType]}
          </Badge>
          {res.readingTime && (
            <span className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Clock className="w-4 h-4" />
              {res.readingTime} min de lecture
            </span>
          )}
          <span className="flex items-center gap-1 text-sm text-on-surface-variant">
            <Eye className="w-4 h-4" />
            {res.viewCount} vue{res.viewCount !== 1 ? "s" : ""}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-6 leading-tight">
          {res.title}
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {res.authorImage ? (
              <img
                src={res.authorImage}
                alt={res.authorName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {getInitials(res.authorName)}
              </div>
            )}
            <div>
              <p className="font-semibold text-on-surface">{res.authorName}</p>
              <p className="text-sm text-on-surface-variant flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="bg-surface-container-highest text-primary rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
              <Bookmark className="w-4.5 h-4.5" />
              Ajouter aux favoris
            </button>
            <button className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5" />
              Marquer comme exploité
            </button>
          </div>
        </div>
      </div>

      {/* Hero image */}
      {res.imageUrl && (
        <div className="aspect-video rounded-xl mb-10 overflow-hidden">
          <img
            src={res.imageUrl}
            alt={res.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content by media type */}
      <ResourceContent
        mediaType={res.mediaType}
        content={res.content}
        title={res.title}
      />

      {/* Comments section */}
      <section className="bg-surface-container-low rounded-2xl p-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md text-on-surface">
            Discussion communautaire
            {topLevelComments.length > 0 && (
              <span className="text-on-surface-variant font-normal text-lg ml-2">
                ({comments.length})
              </span>
            )}
          </h2>
          <Badge variant="secondary">Modéré</Badge>
        </div>

        {/* Comment input */}
        <div className="flex gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
          <div className="flex-1">
            <textarea
              placeholder="Partagez votre expérience ou posez une question..."
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none min-h-[80px]"
            />
            <div className="flex justify-end mt-2">
              <button className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2.5 text-sm font-semibold">
                Publier le commentaire
              </button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        {topLevelComments.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8">
            Aucun commentaire pour le moment. Soyez le premier à partager votre
            avis !
          </p>
        ) : (
          <div className="space-y-6">
            {topLevelComments.map((c) => {
              const commentReplies = replies.filter(
                (r) => r.parentId === c.id
              );
              return (
                <div key={c.id} className="flex gap-4">
                  {c.authorImage ? (
                    <img
                      src={c.authorImage}
                      alt={c.authorName}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                      {getInitials(c.authorName)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-on-surface">
                          {c.authorName}
                        </span>
                        {c.authorId === res.authorId && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0.5 px-2"
                          >
                            Auteur
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {c.createdAt.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-2">
                      {c.content}
                    </p>

                    {/* Replies */}
                    {commentReplies.length > 0 && (
                      <div className="mt-4 ml-2 pl-4 border-l-2 border-primary space-y-4">
                        {commentReplies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            {reply.authorImage ? (
                              <img
                                src={reply.authorImage}
                                alt={reply.authorName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-[10px] font-semibold text-on-surface-variant">
                                {getInitials(reply.authorName)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-on-surface">
                                  {reply.authorName}
                                </span>
                                {reply.authorId === res.authorId && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] py-0.5 px-2"
                                  >
                                    Auteur
                                  </Badge>
                                )}
                                <span className="text-xs text-on-surface-variant">
                                  {reply.createdAt.toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-on-surface-variant">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function ResourceContent({
  mediaType,
  content,
  title,
}: {
  mediaType: string;
  content: string;
  title: string;
}) {
  switch (mediaType) {
    case "article":
      return (
        <article>
          <MarkdownRenderer content={content} />
        </article>
      );

    case "video":
      return (
        <div className="space-y-8">
          {isUrl(content) ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-surface-container-high">
              {content.includes("youtube") || content.includes("youtu.be") ? (
                <iframe
                  src={toYoutubeEmbed(content)}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls className="w-full h-full">
                  <source src={content} />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              )}
            </div>
          ) : (
            <article>
              <MarkdownRenderer content={content} />
            </article>
          )}
        </div>
      );

    case "audio":
      return (
        <div className="space-y-8">
          {isUrl(content) ? (
            <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center gap-4">
              <Headphones className="w-16 h-16 text-primary" />
              <h2 className="text-headline-md text-on-surface">{title}</h2>
              <audio controls className="w-full max-w-xl">
                <source src={content} />
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          ) : (
            <article>
              <MarkdownRenderer content={content} />
            </article>
          )}
        </div>
      );

    case "pdf":
      return (
        <div className="space-y-8">
          {isUrl(content) ? (
            <div className="space-y-4">
              <div
                className="bg-surface-container-low rounded-xl overflow-hidden"
                style={{ height: "80vh" }}
              >
                <iframe
                  src={content}
                  title={title}
                  className="w-full h-full"
                />
              </div>
              <a
                href={content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 gradient-primary text-on-primary-fixed rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <FileDown className="w-4.5 h-4.5" />
                Télécharger le PDF
              </a>
            </div>
          ) : (
            <article>
              <MarkdownRenderer content={content} />
            </article>
          )}
        </div>
      );

    case "exercise":
    case "protocol":
    default:
      return (
        <article>
          <MarkdownRenderer content={content} />
        </article>
      );
  }
}

function isUrl(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function toYoutubeEmbed(url: string): string {
  let videoId = "";
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtu.be")) {
      videoId = urlObj.pathname.slice(1);
    } else {
      videoId = urlObj.searchParams.get("v") || "";
    }
  } catch {
    return url;
  }
  return videoId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
    : url;
}
