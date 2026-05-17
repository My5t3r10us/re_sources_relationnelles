"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Heart, Reply, Trash2, Send, Loader2 } from "lucide-react";
import { addComment, deleteComment, likeComment } from "./comment-actions";
import { ReportButton } from "@/components/ui/report-button";

interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  authorName: string;
  authorImage: string | null;
  authorId: string;
  parentId: string | null;
  likes: number;
}

interface CommentSectionProps {
  resourceId: string;
  resourceAuthorId: string;
  comments: CommentData[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  likedCommentIds?: string[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({
  image,
  name,
  size = "md",
}: {
  image: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={size === "sm" ? 32 : 40}
        height={size === "sm" ? 32 : 40}
        className={`${sizeClasses} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses} rounded-full bg-surface-container-high shrink-0 flex items-center justify-center font-semibold text-on-surface-variant`}
    >
      {getInitials(name)}
    </div>
  );
}

function CommentForm({
  resourceId,
  parentId,
  currentUserImage,
  currentUserName,
  placeholder,
  onCancel,
  autoFocus,
  compact,
}: {
  resourceId: string;
  parentId?: string;
  currentUserImage?: string | null;
  currentUserName?: string;
  placeholder: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!content.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        await addComment(resourceId, content, parentId);
        setContent("");
        onCancel?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors de la publication");
      }
    });
  }

  return (
    <div className={`flex gap-${compact ? "3" : "4"}`}>
      <Avatar
        image={currentUserImage ?? null}
        name={currentUserName || "?"}
        size={compact ? "sm" : "md"}
      />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={2000}
          className={`w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline border-none focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none ${compact ? "min-h-15" : "min-h-20"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        {error && (
          <p className="text-error text-xs mt-1">{error}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-on-surface-variant">
            {content.length}/2000 · Ctrl+Entrée pour envoyer
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5"
              >
                Annuler
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              className="gradient-primary text-on-primary-fixed rounded-xl px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {compact ? "Répondre" : "Publier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  resourceId,
  resourceAuthorId,
  currentUserId,
  currentUserName,
  currentUserImage,
  likedCommentIds,
}: {
  comment: CommentData;
  replies: CommentData[];
  resourceId: string;
  resourceAuthorId: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  likedCommentIds: Set<string>;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localLiked, setLocalLiked] = useState(likedCommentIds.has(comment.id));
  const [localLikes, setLocalLikes] = useState(comment.likes);
  const [replyLikedState, setReplyLikedState] = useState<Record<string, boolean>>(
    () => Object.fromEntries(replies.map((r) => [r.id, likedCommentIds.has(r.id)]))
  );
  const [replyLikesState, setReplyLikesState] = useState<Record<string, number>>(
    () => Object.fromEntries(replies.map((r) => [r.id, r.likes]))
  );

  function handleLike() {
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikes((prev) => (wasLiked ? Math.max(prev - 1, 0) : prev + 1));
    startTransition(async () => {
      await likeComment(comment.id, resourceId);
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer ce commentaire ?")) return;
    startTransition(async () => {
      await deleteComment(comment.id, resourceId);
    });
  }

  return (
    <div className="flex gap-4">
      <Avatar image={comment.authorImage} name={comment.authorName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-on-surface">
              {comment.authorName}
            </span>
            {comment.authorId === resourceAuthorId && (
              <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                Auteur
              </Badge>
            )}
            <span className="text-xs text-on-surface-variant">
              {comment.createdAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {currentUserId && currentUserId !== comment.authorId && (
              <ReportButton commentId={comment.id} size="sm" />
            )}
            {currentUserId === comment.authorId && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-on-surface-variant hover:text-error transition-colors p-1"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-on-surface-variant mb-2 whitespace-pre-wrap wrap-break-word">
          {comment.content}
        </p>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <button
            onClick={handleLike}
            disabled={isPending || !currentUserId}
            className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
              localLiked ? "text-primary" : "hover:text-primary"
            }`}
          >
            <Heart className={`w-4 h-4 ${localLiked ? "fill-current" : ""}`} />
            {localLikes > 0 && localLikes}
          </button>
          {currentUserId && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Reply className="w-4 h-4" />
              Répondre
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && currentUserId && (
          <div className="mt-4">
            <CommentForm
              resourceId={resourceId}
              parentId={comment.id}
              currentUserImage={currentUserImage}
              currentUserName={currentUserName}
              placeholder={`Répondre à ${comment.authorName}...`}
              onCancel={() => setShowReplyForm(false)}
              autoFocus
              compact
            />
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-4 ml-2 pl-4 border-l-2 border-primary space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar
                  image={reply.authorImage}
                  name={reply.authorName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-on-surface">
                        {reply.authorName}
                      </span>
                      {reply.authorId === resourceAuthorId && (
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
                    <div className="flex items-center gap-1">
                      {currentUserId && currentUserId !== reply.authorId && (
                        <ReportButton commentId={reply.id} size="sm" />
                      )}
                      {currentUserId === reply.authorId && (
                        <button
                          onClick={() => {
                            if (!confirm("Supprimer cette réponse ?")) return;
                            startTransition(async () => {
                              await deleteComment(reply.id, resourceId);
                            });
                          }}
                          disabled={isPending}
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap wrap-break-word">
                    {reply.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-1">
                    <button
                      onClick={() => {
                        const wasLiked = replyLikedState[reply.id];
                        setReplyLikedState((prev) => ({ ...prev, [reply.id]: !wasLiked }));
                        setReplyLikesState((prev) => ({
                          ...prev,
                          [reply.id]: wasLiked ? Math.max((prev[reply.id] ?? reply.likes) - 1, 0) : (prev[reply.id] ?? reply.likes) + 1,
                        }));
                        startTransition(async () => {
                          await likeComment(reply.id, resourceId);
                        });
                      }}
                      disabled={isPending || !currentUserId}
                      className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
                        replyLikedState[reply.id] ? "text-primary" : "hover:text-primary"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${replyLikedState[reply.id] ? "fill-current" : ""}`} />
                      {(replyLikesState[reply.id] ?? reply.likes) > 0 && (replyLikesState[reply.id] ?? reply.likes)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({
  resourceId,
  resourceAuthorId,
  comments,
  currentUserId,
  currentUserName,
  currentUserImage,
  likedCommentIds = [],
}: CommentSectionProps) {
  const likedSet = new Set(likedCommentIds);
  const topLevelComments = comments.filter((c) => !c.parentId);
  const allReplies = comments.filter((c) => c.parentId);

  return (
    <section className="bg-surface-container-low rounded-2xl p-8 mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-headline-md text-on-surface">
          Discussion communautaire
          {comments.length > 0 && (
            <span className="text-on-surface-variant font-normal text-lg ml-2">
              ({comments.length})
            </span>
          )}
        </h2>
        <Badge variant="secondary">Modéré</Badge>
      </div>

      {/* Comment input */}
      {currentUserId ? (
        <div className="mb-8">
          <CommentForm
            resourceId={resourceId}
            currentUserImage={currentUserImage}
            currentUserName={currentUserName}
            placeholder="Partagez votre expérience ou posez une question..."
          />
        </div>
      ) : (
        <div className="mb-8 text-center py-4 bg-surface-container-lowest rounded-xl">
          <p className="text-sm text-on-surface-variant">
            <a href="/login" className="text-primary font-semibold hover:underline">
              Connectez-vous
            </a>{" "}
            pour participer à la discussion.
          </p>
        </div>
      )}

      {/* Comments list */}
      {topLevelComments.length === 0 ? (
        <p className="text-center text-on-surface-variant py-8">
          Aucun commentaire pour le moment. Soyez le premier à partager votre
          avis !
        </p>
      ) : (
        <div className="space-y-6">
          {topLevelComments.map((c) => {
            const commentReplies = allReplies.filter(
              (r) => r.parentId === c.id
            );
            return (
              <CommentItem
                key={c.id}
                comment={c}
                replies={commentReplies}
                resourceId={resourceId}
                resourceAuthorId={resourceAuthorId}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserImage={currentUserImage}
                likedCommentIds={likedSet}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
