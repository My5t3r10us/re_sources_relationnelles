import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LogIn, Monitor, Globe } from "lucide-react";
import { db } from "@/db";
import { authLog, user } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";

const ITEMS_PER_PAGE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function JournalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [logs, [{ total }]] = await Promise.all([
    db
      .select({
        id: authLog.id,
        event: authLog.event,
        ipAddress: authLog.ipAddress,
        userAgent: authLog.userAgent,
        createdAt: authLog.createdAt,
        userId: authLog.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(authLog)
      .leftJoin(user, eq(authLog.userId, user.id))
      .orderBy(desc(authLog.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset((page - 1) * ITEMS_PER_PAGE),
    db.select({ total: count() }).from(authLog),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const start = total === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, total);

  const buildUrl = (p: number) => `/admin/journal?page=${p}`;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-lg text-on-surface mb-2">
          Journal des connexions
        </h1>
        <p className="text-lg text-on-surface-variant">
          Historique des connexions réussies (web et mobile), avec adresse IP,
          appareil et horodatage.
        </p>
      </div>

      {/* Log list */}
      <div className="space-y-2 mb-8">
        {logs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-ambient-sm">
            <p className="text-on-surface-variant">
              Aucune connexion enregistrée pour le moment.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient-sm hover:shadow-ambient transition-all flex items-center gap-4"
            >
              {/* Event icon */}
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5" />
              </div>

              {/* User */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface truncate">
                  {log.userName ?? "Utilisateur inconnu"}
                </p>
                <p className="text-sm text-on-surface-variant truncate">
                  {log.userEmail ?? log.userId ?? "—"}
                </p>
              </div>

              {/* IP */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-on-surface-variant min-w-32">
                <Globe className="w-4 h-4 shrink-0" />
                <span className="truncate">{log.ipAddress || "IP inconnue"}</span>
              </div>

              {/* User agent */}
              <div
                className="hidden lg:flex items-center gap-1.5 text-xs text-on-surface-variant max-w-64"
                title={log.userAgent ?? undefined}
              >
                <Monitor className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {log.userAgent || "Appareil inconnu"}
                </span>
              </div>

              {/* Event + date */}
              <div className="text-right min-w-40 shrink-0">
                <Badge variant="success" dot>
                  Connexion
                </Badge>
                <p className="text-xs text-on-surface-variant mt-1">
                  {log.createdAt.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {start} à {end} sur {total} connexions
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={buildUrl(page - 1)}>
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
              <Link href={buildUrl(page + 1)}>
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
