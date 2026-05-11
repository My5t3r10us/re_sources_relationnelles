"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  nl: "Nederlands",
  pt: "Português",
  pl: "Polski",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={t("label")}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors text-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 bg-surface-container-lowest rounded-xl shadow-ambient py-1 z-50 border border-outline-variant/20">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                loc === locale
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
