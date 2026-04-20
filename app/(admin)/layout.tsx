import Link from "next/link";
import { redirect } from "next/navigation";
import { SidebarAdmin } from "@/components/layout/sidebar-admin";
import { Search, Bell, Settings } from "lucide-react";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/statistiques");

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") redirect("/");

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
          <div className="flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="flex items-center bg-surface-container-high rounded-xl px-4 py-2 flex-1">
              <Search className="w-5 h-5 text-on-surface-variant mr-2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder:text-outline flex-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors" aria-label="Notifications">
              <Bell className="w-6 h-6" />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors" aria-label="Paramètres">
              <Settings className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-high" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
      </div>
    </div>
  );
}
