import type { UserRole } from "@/lib/session-user";
import { isAdminRole } from "@/lib/authz";

export type ResourceVisibility = {
  authorId: string;
  status: string;
  privacy: string;
};

export type Viewer = { id: string; role: UserRole } | null | undefined;

export type ViewDenial = "not_found" | "forbidden";

/**
 * Règle de visibilité d'une ressource, partagée par l'API et le rendu web.
 *
 * La page web ne vérifiait que `privacy` et ignorait `status` : n'importe qui
 * pouvait lire par URL directe une ressource en brouillon, en attente, rejetée
 * ou signalée — le contenu écarté par la modération restait donc servi
 * publiquement, alors que l'API appliquait déjà la bonne règle.
 *
 * Retourne `null` si l'accès est autorisé, sinon la nature du refus :
 *  - `not_found` : masque l'existence d'une ressource non publiée.
 *  - `forbidden` : la ressource existe mais reste privée.
 */
export function resourceViewDenial(
  resource: ResourceVisibility,
  viewer: Viewer
): ViewDenial | null {
  const isAdmin = viewer ? isAdminRole(viewer.role) : false;
  const isAuthor = viewer ? viewer.id === resource.authorId : false;

  if (resource.status !== "published" && !isAdmin && !isAuthor) return "not_found";
  if (resource.privacy === "private" && !isAuthor && !isAdmin) return "forbidden";
  return null;
}

export function canViewResource(resource: ResourceVisibility, viewer: Viewer): boolean {
  return resourceViewDenial(resource, viewer) === null;
}
