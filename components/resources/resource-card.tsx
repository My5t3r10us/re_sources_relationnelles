import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FileText, PlayCircle, FileDown, Dumbbell, Headphones, ShieldAlert, Clock, ArrowRight, Bookmark } from "lucide-react";
import { type ReactNode } from "react";

interface ResourceCardProps {
  id: string;
  title: string;
  summary: string;
  mediaType: string;
  categoryName?: string;
  imageUrl?: string;
  readingTime?: number;
  actionLabel?: string;
  actionHref?: string;
}

const mediaTypeLabels: Record<string, string> = {
  article: "Article",
  video: "Série vidéo",
  pdf: "Guide PDF",
  exercise: "Exercice",
  audio: "Audio",
  protocol: "Protocole",
};

const mediaTypeIcons: Record<string, ReactNode> = {
  article: <FileText className="w-4 h-4 text-primary" />,
  video: <PlayCircle className="w-4 h-4 text-primary" />,
  pdf: <FileDown className="w-4 h-4 text-primary" />,
  exercise: <Dumbbell className="w-4 h-4 text-primary" />,
  audio: <Headphones className="w-4 h-4 text-primary" />,
  protocol: <ShieldAlert className="w-4 h-4 text-primary" />,
};

export function ResourceCard({
  id,
  title,
  summary,
  mediaType,
  categoryName,
  imageUrl,
  readingTime,
  actionLabel,
}: ResourceCardProps) {
  return (
    <Link href={`/ressource/${id}`} className="block group">
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
        {imageUrl && (
          <div className="relative aspect-4/3 overflow-hidden">
            <div className="w-full h-full bg-surface-container-high" />
            {categoryName && (
              <div className="absolute top-3 left-3">
                <Badge variant="outline">{categoryName}</Badge>
              </div>
            )}
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            {mediaTypeIcons[mediaType] || <FileText className="w-4 h-4 text-primary" />}
            <span className="text-label-sm text-primary">
              {mediaTypeLabels[mediaType] || mediaType}
            </span>
          </div>
          <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-on-surface-variant line-clamp-3 flex-1">
            {summary}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3">
            {readingTime && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <Clock className="w-4 h-4" />
                {readingTime} min
              </span>
            )}
            {actionLabel && (
              <span className="text-sm font-semibold text-primary flex items-center gap-1">
                {actionLabel}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
            <button
              className="ml-auto text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Sauvegarder"
              onClick={(e) => e.preventDefault()}
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
