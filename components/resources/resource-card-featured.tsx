import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

interface FeaturedResourceCardProps {
  id: string;
  title: string;
  summary: string;
  mediaType: string;
  categoryName?: string;
  readingTime?: number;
  actionLabel?: string;
}

export function FeaturedResourceCard({
  id,
  title,
  summary,
  mediaType,
  categoryName,
  readingTime,
  actionLabel = "Commencer",
}: FeaturedResourceCardProps) {
  return (
    <Link href={`/ressource/${id}`} className="block group col-span-2">
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient transition-all overflow-hidden flex flex-col md:flex-row h-full">
        <div className="relative md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden">
          <div className="w-full h-full bg-surface-container-high min-h-[200px]" />
          <div className="absolute top-3 left-3">
            <Badge variant="primary">
              <Sparkles className="w-3.5 h-3.5" />
              À la une
            </Badge>
          </div>
        </div>
        <div className="p-6 md:w-3/5 flex flex-col justify-center">
          {categoryName && (
            <span className="text-label-sm text-primary mb-2">
              {mediaType === "exercise" ? "Exercice" : categoryName}
            </span>
          )}
          <h3 className="text-headline-md text-on-surface mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">
            {summary}
          </p>
          <div className="flex items-center justify-between">
            {readingTime && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <Clock className="w-4 h-4" />
                {readingTime} min / jour
              </span>
            )}
            <span className="text-sm font-semibold text-primary flex items-center gap-1">
              {actionLabel}
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
