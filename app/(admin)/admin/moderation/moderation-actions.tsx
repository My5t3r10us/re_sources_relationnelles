"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, XCircle, EyeOff } from "lucide-react";
import { updateResourceStatus, updateCommentStatus, deleteComment, resolveReport } from "../actions";
import { useTransition } from "react";

export function ApproveResourceButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="primary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => updateResourceStatus(resourceId, "published"))}
    >
      <CheckCircle className="w-4 h-4" />
      {pending ? "..." : "Approuver"}
    </Button>
  );
}

export function RejectResourceButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => updateResourceStatus(resourceId, "rejected"))}
    >
      <XCircle className="w-4 h-4" />
      {pending ? "..." : "Rejeter"}
    </Button>
  );
}

export function UnpublishResourceButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => updateResourceStatus(resourceId, "rejected"))}
    >
      <EyeOff className="w-4 h-4" />
      {pending ? "..." : "Dépublier"}
    </Button>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => deleteComment(commentId))}
    >
      <Trash2 className="w-4 h-4" />
      {pending ? "..." : "Supprimer"}
    </Button>
  );
}

export function HideCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => updateCommentStatus(commentId, "hidden"))}
    >
      <EyeOff className="w-4 h-4" />
      {pending ? "..." : "Masquer"}
    </Button>
  );
}

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => resolveReport(reportId))}
    >
      <CheckCircle className="w-4 h-4" />
      {pending ? "..." : "Résolu"}
    </Button>
  );
}
