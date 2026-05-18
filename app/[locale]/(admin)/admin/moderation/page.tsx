import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";
import { db } from "@/db";
import { resource, comment, user, category } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import {
  ApproveResourceButton,
  RejectResourceButton,
  UnpublishResourceButton,
  DeleteCommentButton,
  HideCommentButton,
} from "./moderation-actions";

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "il y a moins d'1h";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default async function ModerationPage() {
  const [
    pendingResources,
    flaggedResources,
    flaggedComments,
    [{ pendingCount }],
    [{ flaggedCount }],
  ] = await Promise.all([
    db
      .select({
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        createdAt: resource.createdAt,
        authorName: user.name,
        authorId: user.id,
        categoryName: category.name,
      })
      .from(resource)
      .innerJoin(user, eq(resource.authorId, user.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(resource.status, "pending"))
      .orderBy(desc(resource.createdAt))
      .limit(20),
    db
      .select({
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        createdAt: resource.createdAt,
        authorName: user.name,
        authorId: user.id,
        categoryName: category.name,
      })
      .from(resource)
      .innerJoin(user, eq(resource.authorId, user.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(resource.status, "flagged"))
      .orderBy(desc(resource.createdAt))
      .limit(20),
    db
      .select({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        authorName: user.name,
        resourceTitle: resource.title,
        resourceId: comment.resourceId,
      })
      .from(comment)
      .innerJoin(user, eq(comment.authorId, user.id))
      .innerJoin(resource, eq(comment.resourceId, resource.id))
      .where(eq(comment.status, "flagged"))
      .orderBy(desc(comment.createdAt))
      .limit(20),
    db.select({ pendingCount: count() }).from(resource).where(eq(resource.status, "pending")),
    db.select({ flaggedCount: count() }).from(resource).where(eq(resource.status, "flagged")),
  ]);

  const flaggedCommentsCount = flaggedComments.length;
  const totalItems = pendingResources.length + flaggedResources.length + flaggedComments.length;

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg text-on-surface mb-2">
            File de modération
          </h1>
          <p className="text-on-surface-variant">
            Examinez le contenu signalé et les ressources en attente pour
            maintenir l&apos;intégrité de l&apos;écosystème (RE)Sources Relationnelles.
          </p>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-title-md text-on-surface">
          Nécessite attention
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <Badge variant="secondary">{pendingCount} En attente</Badge>
          <Badge variant="error">{flaggedCount + flaggedCommentsCount} Signalés</Badge>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-12 text-center">
          <p className="text-on-surface-variant text-lg">Aucun élément à modérer pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending resources */}
          {pendingResources.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-sm font-bold">
                    {getInitials(r.authorName)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{r.authorName}</p>
                    <p className="text-xs text-on-surface-variant">Soumis {timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <Badge variant="secondary">⏳ En attente</Badge>
              </div>
              <h3 className="text-title-md text-on-surface mb-2">{r.title}</h3>
              {r.summary && (
                <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">{r.summary}</p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                  {r.mediaType}
                </span>
                {r.categoryName && (
                  <span className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                    {r.categoryName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-auto pt-4">
                <RejectResourceButton resourceId={r.id} />
                <ApproveResourceButton resourceId={r.id} />
              </div>
            </div>
          ))}

          {/* Flagged resources */}
          {flaggedResources.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 flex flex-col border-l-4 border-error/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center text-sm font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{r.authorName}</p>
                    <p className="text-xs text-on-surface-variant">Signalé {timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <Badge variant="error">🚩 Signalé</Badge>
              </div>
              <h3 className="text-title-md text-on-surface mb-2">{r.title}</h3>
              {r.summary && (
                <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">{r.summary}</p>
              )}
              <div className="flex items-center gap-3 mt-auto pt-4">
                <ApproveResourceButton resourceId={r.id} />
                <UnpublishResourceButton resourceId={r.id} />
              </div>
            </div>
          ))}

          {/* Flagged comments */}
          {flaggedComments.map((c) => (
            <div key={c.id} className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 flex flex-col border-l-4 border-error/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-sm font-bold">
                    {getInitials(c.authorName)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{c.authorName}</p>
                    <p className="text-xs text-on-surface-variant">
                      Commentaire sur &quot;{c.resourceTitle}&quot;
                    </p>
                  </div>
                </div>
                <Badge variant="error">🚩 Signalé</Badge>
              </div>
              <h3 className="text-title-md text-on-surface mb-2">Commentaire signalé</h3>
              <div className="bg-surface-container-low rounded-lg p-4 mb-4">
                <p className="text-sm text-on-surface-variant italic">&quot;{c.content}&quot;</p>
              </div>
              <div className="flex items-center gap-3 mt-auto pt-4">
                <HideCommentButton commentId={c.id} />
                <DeleteCommentButton commentId={c.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
