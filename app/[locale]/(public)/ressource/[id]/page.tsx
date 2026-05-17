import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import {
  ArrowLeft,
  Clock,
  FileText,
  PlayCircle,
  FileDown,
  Dumbbell,
  Headphones,
  ShieldAlert,
  Eye,
  Calendar,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { resource, user, category, comment, commentLike, favorite, completion, savedResource } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { CommentSection } from "./comment-section";
import { FavoriteButton, ReadButton, SaveButton, ShareButton } from "./resource-client";
import { ReportButton } from "@/components/ui/report-button";
import { StartSessionButton } from "./start-session-button";

const COLLABORATIVE_TYPES = new Set(["exercise", "protocol"]);

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

  const session = await getServerSession();

  // Enforce privacy access control
  if (res.privacy === "private" && session?.user?.id !== res.authorId) {
    notFound();
  }

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

  let likedCommentIds: string[] = [];
  let isFavorite = false;
  let isSaved = false;
  let isRead = false;
  if (session?.user) {
    const [liked, fav, saved, readStatus] = await Promise.all([
      db
        .select({ commentId: commentLike.commentId })
        .from(commentLike)
        .where(eq(commentLike.userId, session.user.id)),
      db
        .select({ id: favorite.id })
        .from(favorite)
        .where(
          and(
            eq(favorite.userId, session.user.id),
            eq(favorite.resourceId, id)
          )
        )
        .limit(1),
      db
        .select({ id: savedResource.id })
        .from(savedResource)
        .where(
          and(
            eq(savedResource.userId, session.user.id),
            eq(savedResource.resourceId, id)
          )
        )
        .limit(1),
      db
        .select({ id: completion.id })
        .from(completion)
        .where(
          and(
            eq(completion.userId, session.user.id),
            eq(completion.resourceId, id)
          )
        )
        .limit(1),
    ]);
    likedCommentIds = liked.map((l) => l.commentId);
    isFavorite = fav.length > 0;
    isSaved = saved.length > 0;
    isRead = readStatus.length > 0;
  }

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
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {session?.user && res.authorId === session.user.id && (
              <Link
                href={`/ressource/${res.id}/modifier`}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Modifier
              </Link>
            )}
            <ShareButton title={res.title} />
            <SaveButton
              resourceId={res.id}
              isSaved={isSaved}
              isAuthenticated={!!session?.user}
            />
            <FavoriteButton
              resourceId={res.id}
              isFavorite={isFavorite}
              isAuthenticated={!!session?.user}
            />
            <ReadButton
              resourceId={res.id}
              isRead={isRead}
              isAuthenticated={!!session?.user}
            />
            {session?.user && session.user.id !== res.authorId && (
              <ReportButton resourceId={res.id} />
            )}
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

      {/* Collaborative session CTA */}
      {session?.user && res.status === "published" && COLLABORATIVE_TYPES.has(res.mediaType) && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-on-surface mb-1">Pratiquer en groupe ?</p>
            <p className="text-sm text-on-surface-variant">
              Démarrez une session collaborative et invitez d&apos;autres citoyens à participer.
            </p>
          </div>
          <StartSessionButton resourceId={res.id} />
        </div>
      )}

      {/* Content by media type */}
      <ResourceContent
        mediaType={res.mediaType}
        content={res.content}
        title={res.title}
      />

      {/* Comments section */}
      <CommentSection
        resourceId={res.id}
        resourceAuthorId={res.authorId}
        comments={comments}
        currentUserId={session?.user?.id}
        currentUserName={session?.user?.name}
        currentUserImage={session?.user?.image}
        likedCommentIds={likedCommentIds}
      />
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
