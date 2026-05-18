import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/moderation" }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { SidebarAdmin } from "@/components/layout/sidebar-admin";

describe("SidebarAdmin", () => {
  it("renders all admin navigation items", () => {
    render(<SidebarAdmin />);
    for (const label of [
      "Statistiques",
      "Modération",
      "Signalements",
      "Ressources",
      "Catégories",
      "Comptes utilisateurs",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("links 'Nouvelle ressource' to /publier", () => {
    render(<SidebarAdmin />);
    expect(screen.getByText(/Nouvelle ressource/i).closest("a")).toHaveAttribute("href", "/publier");
  });

  it("renders 'Support' shortcut", () => {
    render(<SidebarAdmin />);
    expect(screen.getByText("Support")).toBeInTheDocument();
  });
});
