import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, MessageSquare, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { report, user, resource, comment } from "@/db/schema";
import { eq, count, desc, and, isNotNull, SQL } from "drizzle-orm";
import Link from "next/link";
import { ResolveReportButton } from "../moderation/moderation-actions";
import {
  REPORT_REASON_LABELS,
  REPORT_REASON_VALUES,
  REPORT_TARGET_VALUES,
  type ReportReason,
  type ReportTarget,
} from "@/lib/report-labels";

const ITEMS_PER_PAGE = 15;

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "il y a moins d'1h";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    reason?: string;
    target?: string;
    page?: string;
  }>;
}

export default async function SignalementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "unresolved";
  const reasonFilter = REPORT_REASON_VALUES.includes(params.reason as ReportReason)
    ? (params.reason as ReportReason)
    : "";
  const targetFilter = REPORT_TARGET_VALUES.includes(params.target as ReportTarget)
    ? (params.target as ReportTarget)
    : "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const conditions: SQL[] = [];
  if (statusFilter === "unresolved") conditions.push(eq(report.resolved, false));
  if (statusFilter === "resolved") conditions.push(eq(report.resolved, true));
  if (reasonFilter) conditions.push(eq(report.reason, reasonFilter));
  if (targetFilter === "resource") conditions.push(isNotNull(report.resourceId));
  if (targetFilter === "comment") conditions.push(isNotNull(report.commentId));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }], [{ unresolvedTotal }], [{ resolvedTotal }], [{ globalTotal }]] = await Promise.all([
    db
      .select({
        id: report.id,
        reason: report.reason,
        description: report.description,
        resolved: report.resolved,
        createdAt: report.createdAt,
        resourceId: report.resourceId,
        resourceTitle: resource.title,
        commentId: report.commentId,
        commentContent: comment.content,
        reporterName: user.name,
        reporterEmail: user.email,
      })
      .from(report)
      .leftJoin(user, eq(report.reporterId, user.id))
      .leftJoin(resource, eq(report.resourceId, resource.id))
      .leftJoin(comment, eq(report.commentId, comment.id))
      .where(whereClause)
      .orderBy(desc(report.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset((page - 1) * ITEMS_PER_PAGE),
    db.select({ total: count() }).from(report).where(whereClause),
    db.select({ unresolvedTotal: count() }).from(report).where(eq(report.resolved, false)),
    db.select({ resolvedTotal: count() }).from(report).where(eq(report.resolved, true)),
    db.select({ globalTotal: count() }).from(report),
  ]);

  const totalPages = Math.max(1, Math.ceil(Number(total) / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, Number(total));

  function buildUrl(next: Record<string, string | undefined>) {
    const current: Record<string, string> = {};
    if (statusFilter && statusFilter !== "unresolved") current.status = statusFilter;
    if (reasonFilter) current.reason = reasonFilter;
    if (targetFilter) current.target = targetFilter;
    const merged = { ...current, ...next };
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v) filtered[k] = v;
    }
    const sp = new URLSearchParams(filtered);
    const query = sp.toString();
    return query ? `/admin/signalements?${query}` : `/admin/signalements`;
  }

  const statusOptions = [
    { value: "unresolved", label: "Non résolus" },
    { value: "resolved", label: "Résolus" },
    { value: "all", label: "Tous" },
  ];

  const reasonOptions = [
    { value: "", label: "Toutes raisons" },
    ...REPORT_REASON_VALUES.map((v) => ({ value: v, label: REPORT_REASON_LABELS[v] })),
  ];

  const targetOptions = [
    { value: "", label: "Toutes cibles" },
    { value: "resource", label: "Ressources" },
    { value: "comment", label: "Commentaires" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-lg text-on-surface mb-2">Signalements</h1>
        <p className="text-lg text-on-surface-variant">
          Centralisez l&apos;ensemble des signalements de ressources et de
          commentaires soumis par la communauté.
        </p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5">
          <p className="text-label-md text-on-surface-variant mb-1">Total</p>
          <p className="text-display-md text-on-surface">{Number(globalTotal)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5">
          <p className="text-label-md text-on-surface-variant mb-1">Non résolus</p>
          <p className="text-display-md text-error">{Number(unresolvedTotal)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5">
          <p className="text-label-md text-on-surface-variant mb-1">Résolus</p>
          <p className="text-display-md text-tertiary">{Number(resolvedTotal)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-label-md text-on-surface-variant mr-2">Statut</span>
          {statusOptions.map((opt) => (
            <Link
              key={opt.value}
              href={buildUrl({ status: opt.value === "unresolved" ? undefined : opt.value, page: undefined })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-label-md text-on-surface-variant mr-2">Raison</span>
          {reasonOptions.map((opt) => (
            <Link
              key={opt.value || "all"}
              href={buildUrl({ reason: opt.value || undefined, page: undefined })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                reasonFilter === opt.value
                  ? "bg-primary text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-label-md text-on-surface-variant mr-2">Cible</span>
          {targetOptions.map((opt) => (
            <Link
              key={opt.value || "all"}
              href={buildUrl({ target: opt.value || undefined, page: undefined })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                targetFilter === opt.value
                  ? "bg-primary text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Report list */}
      {rows.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-12 text-center">
          <Flag className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
          <p className="text-on-surface-variant">Aucun signalement ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {rows.map((r) => {
            const isResource = !!r.resourceId;
            const targetLink = isResource && r.resourceId
              ? `/ressource/${r.resourceId}`
              : null;
            return (
              <div
                key={r.id}
                className={`bg-surface-container-lowest rounded-xl shadow-ambient-sm p-5 flex flex-col gap-3 ${
                  r.resolved ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                      {isResource ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-on-surface truncate">
                        {r.reporterName ?? "Utilisateur supprimé"}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {r.reporterEmail ?? "—"} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isResource ? "primary" : "secondary"}>
                      {isResource ? "Ressource" : "Commentaire"}
                    </Badge>
                    <Badge variant="error">{REPORT_REASON_LABELS[r.reason] ?? r.reason}</Badge>
                    {r.resolved && <Badge variant="success">Résolu</Badge>}
                  </div>
                </div>

                {/* Target preview */}
                <div className="bg-surface-container-low rounded-lg p-3">
                  {isResource ? (
                    <p className="text-sm text-on-surface">
                      <span className="text-on-surface-variant">Ressource : </span>
                      {targetLink ? (
                        <Link href={targetLink} className="font-medium text-primary hover:underline" target="_blank">
                          {r.resourceTitle ?? "(supprimée)"}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.resourceTitle ?? "(supprimée)"}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-on-surface-variant italic line-clamp-3">
                      &quot;{r.commentContent ?? "(commentaire supprimé)"}&quot;
                    </p>
                  )}
                </div>

                {r.description && (
                  <p className="text-sm text-on-surface-variant">
                    <span className="font-medium text-on-surface">Motif détaillé : </span>
                    {r.description}
                  </p>
                )}

                {!r.resolved && (
                  <div className="flex items-center justify-end pt-2 border-t border-outline-variant/10">
                    <ResolveReportButton reportId={r.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {Number(total) > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {start} à {end} sur {Number(total)} signalements
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={buildUrl({ page: String(page - 1) })}>
                <Button variant="secondary" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
            )}
            {page < totalPages ? (
              <Link href={buildUrl({ page: String(page + 1) })}>
                <Button variant="secondary" size="sm">
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
