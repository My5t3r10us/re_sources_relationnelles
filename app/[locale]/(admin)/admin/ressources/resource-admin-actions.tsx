"use client";

import { useTransition } from "react";
import {
  updateResourceStatus,
  deleteResource,
  toggleFeaturedResource,
} from "../actions";
import { Trash2, Star, CheckCircle, XCircle, Flag } from "lucide-react";

export function AdminResourceActions({
  resourceId,
  currentStatus,
  isFeatured,
}: {
  resourceId: string;
  currentStatus: string;
  isFeatured: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {currentStatus !== "published" && (
        <button
          disabled={pending}
          className="p-1.5 rounded-lg text-tertiary hover:bg-tertiary/10 transition-colors disabled:opacity-50"
          title="Publier"
          onClick={() =>
            startTransition(() => updateResourceStatus(resourceId, "published"))
          }
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
      {currentStatus !== "rejected" && (
        <button
          disabled={pending}
          className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-50"
          title="Rejeter"
          onClick={() =>
            startTransition(() => updateResourceStatus(resourceId, "rejected"))
          }
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
      {currentStatus !== "flagged" && (
        <button
          disabled={pending}
          className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-50"
          title="Signaler"
          onClick={() =>
            startTransition(() => updateResourceStatus(resourceId, "flagged"))
          }
        >
          <Flag className="w-4 h-4" />
        </button>
      )}
      <button
        disabled={pending}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          isFeatured
            ? "text-yellow-500 hover:bg-yellow-50"
            : "text-on-surface-variant hover:bg-surface-container-high"
        }`}
        title={isFeatured ? "Retirer la mise en avant" : "Mettre en avant"}
        onClick={() =>
          startTransition(() =>
            toggleFeaturedResource(resourceId, !isFeatured)
          )
        }
      >
        <Star className={`w-4 h-4 ${isFeatured ? "fill-current" : ""}`} />
      </button>
      <button
        disabled={pending}
        className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-50"
        title="Supprimer définitivement"
        onClick={() => {
          if (confirm("Supprimer cette ressource définitivement ?"))
            startTransition(() => deleteResource(resourceId));
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
