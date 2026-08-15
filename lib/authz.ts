import { userRoleEnum } from "@/db/schema";
import type { UserRole } from "@/lib/session-user";

export const ROLES = userRoleEnum.enumValues;

/**
 * ⚠️ Le rôle `moderator` n'accorde aujourd'hui AUCUN droit.
 *
 * Il existe dans l'enum et s'attribue depuis le panneau, mais `isAdminRole`
 * ne le reconnaît pas : un modérateur n'a accès à aucun outil de modération.
 * Un rôle qui semble accorder des droits sans en accorder est une source
 * d'erreur d'exploitation — on peut croire un compte habilité alors qu'il ne
 * l'est pas.
 *
 * Trancher est un choix produit, pas un correctif : soit lui ouvrir la
 * modération des contenus et des signalements (sans la gestion de comptes),
 * soit le retirer de l'enum. En attendant, l'écart est explicite ici.
 */
export const MODERATOR_HAS_NO_PRIVILEGES = true;

/**
 * Rôles qu'un acteur peut attribuer, selon son propre rôle.
 *
 * Ces listes sont vérifiées À L'EXÉCUTION. Les signatures TypeScript des
 * Server Actions ne contraignent rien : une Server Action exportée est une
 * route HTTP réelle dont les arguments arrivent du réseau. Sans cette liste,
 * un administrateur pouvait s'attribuer `super_admin`.
 */
export const ASSIGNABLE_BY_ADMIN: readonly UserRole[] = ["citizen", "moderator", "admin"];
export const ASSIGNABLE_BY_SUPER_ADMIN: readonly UserRole[] = [
  "citizen",
  "moderator",
  "admin",
  "super_admin",
];

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function assignableRoles(actorRole: UserRole): readonly UserRole[] {
  if (actorRole === "super_admin") return ASSIGNABLE_BY_SUPER_ADMIN;
  if (actorRole === "admin") return ASSIGNABLE_BY_ADMIN;
  return [];
}

export function canAssignRole(actorRole: UserRole, role: string): role is UserRole {
  return assignableRoles(actorRole).includes(role as UserRole);
}

export type ManageDenialReason = "self" | "protected_target" | "insufficient_role";

/**
 * Un acteur peut-il agir sur le compte d'un autre (rôle, activation) ?
 *
 * Trois refus :
 *  - `self` : on ne modifie ni son propre rôle ni sa propre activation
 *    (auto-promotion, et auto-verrouillage du dernier administrateur).
 *  - `protected_target` : seul un super-administrateur agit sur un
 *    super-administrateur — sans quoi un simple admin pouvait rétrograder puis
 *    désactiver le super-administrateur et prendre la main sur la plateforme.
 *  - `insufficient_role` : l'acteur n'est pas administrateur.
 */
export function canManageUser(
  actor: { id: string; role: UserRole },
  target: { id: string; role: UserRole }
): { allowed: true } | { allowed: false; reason: ManageDenialReason } {
  if (!isAdminRole(actor.role)) return { allowed: false, reason: "insufficient_role" };
  if (actor.id === target.id) return { allowed: false, reason: "self" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { allowed: false, reason: "protected_target" };
  }
  return { allowed: true };
}

export function manageDenialMessage(reason: ManageDenialReason): string {
  switch (reason) {
    case "self":
      return "Vous ne pouvez pas modifier votre propre compte";
    case "protected_target":
      return "Seul un super-administrateur peut agir sur un super-administrateur";
    case "insufficient_role":
      return "Accès réservé aux administrateurs";
  }
}
