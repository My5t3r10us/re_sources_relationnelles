import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("search=hello&page=3"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { SidebarCatalog } from "@/components/layout/sidebar-catalog";

const categories = [
  { id: "1", name: "Bien-être", slug: "bien-etre", description: null, icon: null },
  { id: "2", name: "Anxiété", slug: "anxiete-stress", description: null, icon: null },
];

describe("SidebarCatalog", () => {
  it("renders 'Toutes les ressources' link without categorie param", () => {
    render(<SidebarCatalog categories={categories} activeSlug="" />);
    const link = screen.getByText("Toutes les ressources").closest("a");
    expect(link?.getAttribute("href")).toMatch(/^\/catalogue\?/);
    expect(link?.getAttribute("href")).not.toContain("categorie=");
    expect(link?.getAttribute("href")).not.toContain("page=");
  });

  it("renders each category as link with categorie param", () => {
    render(<SidebarCatalog categories={categories} activeSlug="" />);
    const link = screen.getByText("Bien-être").closest("a");
    expect(link?.getAttribute("href")).toContain("categorie=bien-etre");
  });

  it("highlights the active category", () => {
    render(<SidebarCatalog categories={categories} activeSlug="anxiete-stress" />);
    const activeLink = screen.getByText("Anxiété").closest("a")!;
    expect(activeLink.className).toContain("text-primary");
    expect(activeLink.className).toContain("font-bold");
  });
});
