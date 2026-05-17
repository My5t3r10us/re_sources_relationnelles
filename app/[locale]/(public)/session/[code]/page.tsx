import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { resourceSession, sessionParticipant, user, resource } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { ArrowLeft } from "lucide-react";
import { SessionClient } from "./session-client";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { code } = await params;
  const session = await getServerSession();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/session/${code}`)}`);

  const [sess] = await db
    .select({
      id: resourceSession.id,
      shareCode: resourceSession.shareCode,
      status: resourceSession.status,
      startedAt: resourceSession.startedAt,
      endedAt: resourceSession.endedAt,
      hostId: resourceSession.hostId,
      hostName: user.name,
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceMediaType: resource.mediaType,
    })
    .from(resourceSession)
    .innerJoin(user, eq(resourceSession.hostId, user.id))
    .innerJoin(resource, eq(resourceSession.resourceId, resource.id))
    .where(eq(resourceSession.shareCode, code))
    .limit(1);

  if (!sess) notFound();

  const participants = await db
    .select({
      id: sessionParticipant.id,
      userId: sessionParticipant.userId,
      userName: user.name,
      joinedAt: sessionParticipant.joinedAt,
    })
    .from(sessionParticipant)
    .innerJoin(user, eq(sessionParticipant.userId, user.id))
    .where(and(eq(sessionParticipant.sessionId, sess.id), isNull(sessionParticipant.leftAt)));

  const isParticipant = participants.some((p) => p.userId === session.user.id);
  const isHost = sess.hostId === session.user.id;

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 min-h-screen flex flex-col">
      <Link
        href={`/ressource/${sess.resourceId}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la ressource
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">
            Session collaborative
          </span>
          {sess.status === "ended" && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-error/10 text-error font-medium">
              Terminée
            </span>
          )}
        </div>
        <h1 className="text-display-md text-on-surface mb-1">{sess.resourceTitle}</h1>
        <p className="text-on-surface-variant">
          Hôte : <strong>{sess.hostName}</strong> · Code : <code className="font-mono">{sess.shareCode}</code>
        </p>
      </div>

      <SessionClient
        code={code}
        status={sess.status}
        isHost={isHost}
        isParticipant={isParticipant}
        currentUserId={session.user.id}
        initialParticipants={participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          userName: p.userName,
          joinedAt: p.joinedAt.toISOString(),
          leftAt: null,
        }))}
      />
    </main>
  );
}
