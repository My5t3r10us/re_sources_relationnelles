"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, LogOut, LayoutDashboard, ShieldCheck, BookOpen, MessageCircleQuestionMark } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Nav");

  const navItems = [
    { href: "/catalogue", label: t("catalogue") },
    { href: "/bien-etre", label: t("wellness") },
    { href: "/communaute", label: t("community") },
    { href: "/urgence", label: t("emergency") },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="glassmorphism sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-on-surface">
          (RE)Sources Relationnelles
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname.includes(item.href)
                  ? "text-primary border-b-2 border-primary pb-0.5"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="hidden md:flex items-center gap-2 bg-surface-container-high rounded-xl px-4 py-2 text-sm text-on-surface-variant"
            aria-label={t("searchLabel")}
          >
            <Search className="w-5 h-5" />
            <span className="text-outline">{t("searchPlaceholder")}</span>
          </button>

          <LanguageSwitcher />

          <button
            className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
            aria-label={t("notificationsLabel")}
          >
            <Link href="/aide">
              <MessageCircleQuestionMark className="w-6 h-6" />
            </Link>
          </button>

          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 rounded-full bg-primary text-on-primary-fixed flex items-center justify-center font-semibold text-sm"
                aria-label={t("myAccount")}
              >
                {session.user.name?.charAt(0).toUpperCase() ?? "U"}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-ambient py-2 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/20">
                    <p className="text-sm font-semibold text-on-surface truncate">{session.user.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{session.user.email}</p>
                  </div>
                  <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setMenuOpen(false)}>
                    <User className="w-4 h-4" /> {t("myProfile")}
                  </Link>
                  <Link href="/tableau-de-bord" className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" /> {t("dashboard")}
                  </Link>
                  <Link href="/mes-ressources" className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setMenuOpen(false)}>
                    <BookOpen className="w-4 h-4" /> {t("myResources")}
                  </Link>
                  {(["admin", "super_admin"] as string[]).includes((session.user as Record<string, unknown>).role as string) && (
                    <Link href="/admin/statistiques" className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary font-medium hover:bg-surface-container-high transition-colors" onClick={() => setMenuOpen(false)}>
                      <ShieldCheck className="w-4 h-4" /> {t("administration")}
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await authClient.signOut();
                      setMenuOpen(false);
                      window.location.href = "/";
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-surface-container-high transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              aria-label={t("login")}
            >
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
