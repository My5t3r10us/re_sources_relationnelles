import Link from "next/link";
import { redirect } from "next/navigation";
import { SidebarAdmin } from "@/components/layout/sidebar-admin";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/authz";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `getServerSession` relit déjà le rôle en base et rejette les comptes
  // désactivés : plus besoin d'une seconde requête, et un administrateur
  // désactivé n'atteint plus le panneau.
  const session = await getServerSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/statistiques");
  if (!isAdminRole(session.user.role)) redirect("/");

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAdmin />
      <div className="flex-1 md:ml-64 flex flex-col overflow-hidden">
        {/* Admin top bar */}
        <header className="glassmorphism h-16 flex items-center justify-between px-6 shadow-sm shrink-0 z-30">
          <Link
            href="/admin/statistiques"
            className="font-bold text-primary text-lg"
          >
            (RE)Sources Admin
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;app
            </Link>
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary-fixed flex items-center justify-center font-semibold text-sm">
              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
      </div>
    </div>
  );
}
