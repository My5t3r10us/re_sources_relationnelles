import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Download, Pencil, Ban, ChevronLeft, ChevronRight } from "lucide-react";

const users = [
  {
    id: "1",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    role: "admin" as const,
    status: "active" as const,
    lastLogin: "Dernière connexion : il y a 2h",
    avatar: null,
  },
  {
    id: "2",
    name: "Marcus Chen",
    email: "m.chen@example.com",
    role: "moderator" as const,
    status: "active" as const,
    lastLogin: "Dernière connexion : il y a 1j",
    initials: "MC",
  },
  {
    id: "3",
    name: "David Miller",
    email: "d.miller@example.com",
    role: "citizen" as const,
    status: "deactivated" as const,
    lastLogin: "Désactivé le : 12 oct.",
    avatar: null,
  },
];

const roleConfig = {
  admin: { label: "Admin", variant: "primary" as const },
  moderator: { label: "Modérateur", variant: "secondary" as const },
  citizen: { label: "Citoyen", variant: "outline" as const },
};

const statusConfig = {
  active: { label: "Actif", variant: "success" as const },
  deactivated: { label: "Désactivé", variant: "error" as const },
};

export default function UtilisateursPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-display-lg text-on-surface mb-2">
        Comptes utilisateurs
      </h1>
      <p className="text-lg text-on-surface-variant mb-8">
        Gérez l&apos;accès des utilisateurs, assignez les rôles et surveillez le
        statut des comptes sur la plateforme.
      </p>

      {/* Filters */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-1">
          <span className="text-label-md text-on-surface-variant mr-3">
            Filtrer par rôle
          </span>
          {["Tous", "Admin", "Modérateur", "Citoyen"].map((filter, i) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-primary text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Filter className="w-4 h-4" />
            Plus de filtres
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-3 mb-8">
        {users.map((user) => (
          <div
            key={user.id}
            className={`group bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm hover:shadow-ambient transition-all flex items-center gap-4 ${
              user.status === "deactivated" ? "opacity-60" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                user.status === "deactivated"
                  ? "bg-surface-container-high text-on-surface-variant grayscale"
                  : "bg-surface-container-high text-on-surface"
              }`}
            >
              {user.initials ||
                user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface">{user.name}</p>
              <p className="text-sm text-on-surface-variant truncate">
                {user.email}
              </p>
            </div>

            {/* Role badge */}
            <Badge variant={roleConfig[user.role].variant} dot>
              {roleConfig[user.role].label}
            </Badge>

            {/* Status */}
            <div className="text-right min-w-[140px]">
              <Badge variant={statusConfig[user.status].variant}>
                {statusConfig[user.status].label}
              </Badge>
              <p className="text-xs text-on-surface-variant mt-1">
                {user.lastLogin}
              </p>
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                aria-label="Modifier"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"
                aria-label="Bloquer"
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          Affichage <strong>1</strong> à <strong>10</strong> sur{" "}
          <strong>245</strong> utilisateurs
        </p>
        <div className="flex items-center gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 transition-colors"
            disabled
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
