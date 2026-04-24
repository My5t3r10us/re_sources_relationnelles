"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Smile, X } from "lucide-react";
import { EMOJI_CATEGORIES } from "@/lib/emojis";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

export function EmojiPicker({
  value,
  onChange,
  placeholder = "Choisir un émoji",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const displayed = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return EMOJI_CATEGORIES.flatMap((c) => c.items).filter((item) =>
        item.name.includes(q)
      );
    }
    return EMOJI_CATEGORIES[activeCategory]?.items ?? [];
  }, [search, activeCategory]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 w-full bg-surface-container-high rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-surface-container transition-colors text-left"
      >
        {value ? (
          <>
            <span className="text-xl leading-none shrink-0">{value}</span>
            <span className="flex-1 text-on-surface-variant text-xs">
              Modifier l&apos;émoji
            </span>
          </>
        ) : (
          <>
            <Smile className="w-5 h-5 text-on-surface-variant shrink-0" />
            <span className="flex-1 text-on-surface-variant">{placeholder}</span>
          </>
        )}
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Supprimer l'émoji"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleClear(e as unknown as React.MouseEvent);
            }}
            className="shrink-0 text-on-surface-variant/60 hover:text-error transition-colors p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-72 bg-surface-container-lowest rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 10px 30px rgba(45,51,53,0.12)" }}
        >
          {/* Search */}
          <div className="p-2.5 pb-1.5">
            <div className="flex items-center gap-2 bg-surface-container-high rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un émoji..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-on-surface-variant/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-on-surface-variant/60 hover:text-on-surface transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {!search.trim() && (
            <div className="flex gap-1 px-2.5 pb-1.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveCategory(i)}
                  className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                    activeCategory === i
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-0.5 p-2 pt-1 max-h-52 overflow-y-auto">
            {displayed.length === 0 ? (
              <p className="col-span-8 text-center text-xs text-on-surface-variant py-6">
                Aucun résultat
              </p>
            ) : (
              displayed.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  title={item.name}
                  onClick={() => handleSelect(item.emoji)}
                  className={`aspect-square flex items-center justify-center text-lg rounded-lg transition-colors hover:bg-surface-container-high ${
                    value === item.emoji
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  {item.emoji}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
