import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, count, desc, ilike, and, SQL } from "drizzle-orm";
import Link from "next/link";
import { UserActions } from "./user-actions";
import { CreateUserModal } from "./create-user-modal";
import { getServerSession } from "@/lib/auth-server";

const ITEMS_PER_PAGE = 10;

const roleConfig = {
  admin: { label: "Admin", variant: "primary" as const },
  super_admin: { label: "Super-Admin", variant: "primary" as const },
  moderator: { label: "Modérateur", variant: "secondary" as const },
  citizen: { label: "Citoyen", variant: "outline" as const },
};

const statusConfig = {
  active: { label: "Actif", variant: "success" as const },
  deactivated: { label: "Désactivé", variant: "error" as const },
};

interface PageProps {
  searchParams: Promise<{
    role?: string;
    page?: string;
    q?: string;
  }>;
}

export default async function UtilisateursPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const roleFilter = params.role ?? "";
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const session = await getServerSession();
  let viewerRole = "admin";
  if (session?.user) {
    const [viewer] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
    viewerRole = viewer?.role ?? "admin";
  }

  // Build conditions
  const conditions: SQL[] = [];
  if (roleFilter && ["admin", "super_admin", "moderator", "citizen"].includes(roleFilter)) {
    conditions.push(eq(user.role, roleFilter as "admin" | "super_admin" | "moderator" | "citizen"));
  }
  if (search) {
    conditions.push(ilike(user.name, `%${search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, [{ total }]] = await Promise.all([
    db
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset((page - 1) * ITEMS_PER_PAGE),
    db.select({ total: count() }).from(user).where(whereClause),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, total);

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams(params);
    return `/admin/utilisateurs?${sp.toString()}`;
  }

  const roleFilters = [
    { value: "", label: "Tous" },
    { value: "super_admin", label: "Super-Admin" },
    { value: "admin", label: "Admin" },
    { value: "moderator", label: "Modérateur" },
    { value: "citizen", label: "Citoyen" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
        <div>
          <h1 className="text-display-lg text-on-surface mb-2">
            Comptes utilisateurs
          </h1>
          <p className="text-lg text-on-surface-variant mb-8">
            Gérez l&apos;accès des utilisateurs, assignez les rôles et surveillez le
            statut des comptes sur la plateforme.
          </p>
        </div>
        {viewerRole === "super_admin" && <CreateUserModal />}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-1">
          <span className="text-label-md text-on-surface-variant mr-3">
            Filtrer par rôle
          </span>
          {roleFilters.map((filter) => (
            <Link
              key={filter.value}
              href={buildUrl({ ...(filter.value ? { role: filter.value } : {}), ...(search ? { q: search } : {}) })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                roleFilter === filter.value
                  ? "bg-primary text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="space-y-3 mb-8">
        {users.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-ambient-sm">
            <p className="text-on-surface-variant">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          users.map((u) => {
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const status = u.active ? "active" : "deactivated";
            return (
              <div
                key={u.id}
                className={`group bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm hover:shadow-ambient transition-all flex items-center gap-4 ${
                  !u.active ? "opacity-60" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    !u.active
                      ? "bg-surface-container-high text-on-surface-variant grayscale"
                      : "bg-surface-container-high text-on-surface"
                  }`}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface">{u.name}</p>
                  <p className="text-sm text-on-surface-variant truncate">
                    {u.email}
                  </p>
                </div>

                {/* Role badge */}
                <Badge variant={roleConfig[u.role].variant} dot>
                  {roleConfig[u.role].label}
                </Badge>

                {/* Status */}
                <div className="text-right min-w-35">
                  <Badge variant={statusConfig[status].variant}>
                    {statusConfig[status].label}
                  </Badge>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Inscrit le {u.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <UserActions userId={u.id} currentRole={u.role} isActive={u.active} viewerRole={viewerRole} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {start} à {end} sur {total} utilisateurs
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl({
                  page: String(page - 1),
                  ...(roleFilter ? { role: roleFilter } : {}),
                  ...(search ? { q: search } : {}),
                })}
              >
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
              <Link
                href={buildUrl({
                  page: String(page + 1),
                  ...(roleFilter ? { role: roleFilter } : {}),
                  ...(search ? { q: search } : {}),
                })}
              >
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
