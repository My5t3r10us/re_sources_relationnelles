"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Ban, CheckCircle, ShieldCheck, Shield, UserRound, Crown } from "lucide-react";
import { updateUserRole, toggleUserActive, updateUserRoleAsAdmin } from "../actions";
import { useTransition, useState } from "react";

export function UserActions({
  userId,
  currentRole,
  isActive,
  viewerRole,
}: {
  userId: string;
  currentRole: string;
  isActive: boolean;
  viewerRole: string;
}) {
  const [pending, startTransition] = useTransition();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const isSuperAdmin = viewerRole === "super_admin";

  const roles = isSuperAdmin
    ? ([
        { value: "citizen", label: "Citoyen", icon: <UserRound className="w-4 h-4" /> },
        { value: "moderator", label: "Modérateur", icon: <Shield className="w-4 h-4" /> },
        { value: "admin", label: "Admin", icon: <ShieldCheck className="w-4 h-4" /> },
        { value: "super_admin", label: "Super-Admin", icon: <Crown className="w-4 h-4" /> },
      ] as const)
    : ([
        { value: "citizen", label: "Citoyen", icon: <UserRound className="w-4 h-4" /> },
        { value: "moderator", label: "Modérateur", icon: <Shield className="w-4 h-4" /> },
        { value: "admin", label: "Admin", icon: <ShieldCheck className="w-4 h-4" /> },
      ] as const);

  const handleRoleChange = (role: string) => {
    setShowRoleMenu(false);
    startTransition(() => {
      if (isSuperAdmin) {
        updateUserRoleAsAdmin(userId, role as "citizen" | "moderator" | "admin" | "super_admin");
      } else {
        updateUserRole(userId, role as "citizen" | "moderator" | "admin");
      }
    });
  };

  return (
    <div className="flex items-center gap-2 relative">
      <div className="relative">
        <button
          className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Modifier le rôle"
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          disabled={pending}
        >
          <Pencil className="w-5 h-5" />
        </button>
        {showRoleMenu && (
          <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 py-1 z-50 min-w-40">
            {roles.map((role) => (
              <button
                key={role.value}
                disabled={role.value === currentRole || pending}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                  role.value === currentRole
                    ? "text-primary font-semibold bg-primary/5"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
                onClick={() => handleRoleChange(role.value)}
              >
                {role.icon}
                {role.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        className={`p-2 rounded-lg transition-colors ${
          isActive
            ? "text-on-surface-variant hover:text-error hover:bg-error/5"
            : "text-on-surface-variant hover:text-tertiary hover:bg-tertiary/5"
        }`}
        aria-label={isActive ? "Désactiver" : "Réactiver"}
        disabled={pending}
        onClick={() => startTransition(() => toggleUserActive(userId))}
      >
        {isActive ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}
