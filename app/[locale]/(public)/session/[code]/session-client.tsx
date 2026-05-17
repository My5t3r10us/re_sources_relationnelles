"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, LogOut, Power, Copy, Check, Users, Loader2 } from "lucide-react";

interface Participant {
  id: string;
  userId: string;
  userName: string | null;
  joinedAt: string;
  leftAt: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
}

interface Props {
  code: string;
  status: "active" | "ended";
  isHost: boolean;
  isParticipant: boolean;
  currentUserId: string;
  initialParticipants: Participant[];
}

const POLL_INTERVAL_MS = 3000;

export function SessionClient({
  code,
  status: initialStatus,
  isHost,
  isParticipant: initialParticipant,
  currentUserId,
  initialParticipants,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isParticipant, setIsParticipant] = useState(initialParticipant);
  const [participants, setParticipants] = useState(initialParticipants);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastMessageAtRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling effect for messages + participants
  useEffect(() => {
    if (!isParticipant || status === "ended") return;

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const sinceQs = lastMessageAtRef.current
          ? `?since=${encodeURIComponent(lastMessageAtRef.current)}`
          : "";
        const [msgRes, sessRes] = await Promise.all([
          fetch(`/api/v1/sessions/${code}/messages${sinceQs}`, { cache: "no-store" }),
          fetch(`/api/v1/sessions/${code}`, { cache: "no-store" }),
        ]);
        if (cancelled) return;

        if (msgRes.ok) {
          const json = await msgRes.json();
          const newMessages: Message[] = json.data ?? [];
          if (newMessages.length > 0) {
            setMessages((prev) => [...prev, ...newMessages]);
            lastMessageAtRef.current = newMessages[newMessages.length - 1].createdAt;
          }
        }

        if (sessRes.ok) {
          const json = await sessRes.json();
          if (json.data) {
            setParticipants(json.data.participants ?? []);
            if (json.data.status === "ended" && status !== "ended") {
              setStatus("ended");
            }
          }
        }
      } catch {
        // network blip — next tick will retry
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [code, isParticipant, status]);

  // Initial load of all existing messages (only once after join)
  useEffect(() => {
    if (!isParticipant || lastMessageAtRef.current !== null) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/v1/sessions/${code}/messages`, { cache: "no-store" });
      if (cancelled || !res.ok) return;
      const json = await res.json();
      const all: Message[] = json.data ?? [];
      setMessages(all);
      if (all.length > 0) lastMessageAtRef.current = all[all.length - 1].createdAt;
    })();
    return () => { cancelled = true; };
  }, [code, isParticipant]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleJoin() {
    setJoining(true);
    const res = await fetch(`/api/v1/sessions/${code}/join`, { method: "POST" });
    setJoining(false);
    if (res.ok) {
      setIsParticipant(true);
      router.refresh();
    }
  }

  async function handleLeave() {
    if (!confirm("Quitter cette session ?")) return;
    await fetch(`/api/v1/sessions/${code}/leave`, { method: "POST" });
    router.push("/catalogue");
  }

  async function handleEnd() {
    if (!confirm("Terminer définitivement cette session pour tous les participants ?")) return;
    await fetch(`/api/v1/sessions/${code}`, { method: "DELETE" });
    setStatus("ended");
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/v1/sessions/${code}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });
    setSending(false);
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        setMessages((prev) => [...prev, json.data]);
        lastMessageAtRef.current = json.data.createdAt;
      }
      setInput("");
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/session/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "ended") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <Power className="w-16 h-16 text-on-surface-variant/40 mb-4" />
        <h2 className="text-headline-md text-on-surface mb-2">Session terminée</h2>
        <p className="text-on-surface-variant mb-6">L&apos;hôte a clos cette session collaborative.</p>
        <button
          onClick={() => router.push("/catalogue")}
          className="gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 text-sm font-semibold"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <Users className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-headline-md text-on-surface mb-2">Rejoindre la session</h2>
        <p className="text-on-surface-variant mb-6">
          Cette session collaborative est en cours avec {participants.length} participant
          {participants.length !== 1 ? "s" : ""}.
        </p>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
        >
          {joining && <Loader2 className="w-4 h-4 animate-spin" />}
          Rejoindre
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
      {/* Sidebar */}
      <aside className="md:col-span-1 space-y-4">
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-title-sm text-on-surface">
              Participants ({participants.length})
            </h3>
          </div>
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span className="text-on-surface">{p.userName ?? "Anonyme"}</span>
                {p.userId === currentUserId && (
                  <span className="text-xs text-on-surface-variant">(vous)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5 space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-tertiary" /> : <Copy className="w-4 h-4" />}
            {copied ? "Lien copié !" : "Copier le lien"}
          </button>
          {isHost ? (
            <button
              onClick={handleEnd}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-semibold hover:bg-error/15 transition-colors"
            >
              <Power className="w-4 h-4" />
              Terminer la session
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-semibold hover:bg-surface-container-highest transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Quitter
            </button>
          )}
        </div>
      </aside>

      {/* Chat */}
      <section className="md:col-span-2 flex flex-col bg-surface-container-lowest rounded-xl shadow-ambient-sm min-h-[60vh] max-h-[75vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-on-surface-variant text-sm py-12">
              Aucun message pour l&apos;instant. Soyez le premier à écrire !
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.authorId === currentUserId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      mine
                        ? "bg-primary text-on-primary-fixed"
                        : "bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {!mine && (
                      <p className="text-xs font-semibold mb-0.5 opacity-80">
                        {m.authorName ?? "Anonyme"}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{m.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-outline-variant/20 p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrire un message..."
            rows={1}
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            className="flex-1 bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Envoyer"
            className="w-11 h-11 rounded-xl gradient-primary text-on-primary-fixed inline-flex items-center justify-center disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </section>
    </div>
  );
}
