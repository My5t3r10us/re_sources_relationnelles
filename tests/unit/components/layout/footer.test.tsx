import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/footer";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Footer", () => {
  it("renders copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/Sources Relationnelles/)).toBeInTheDocument();
  });

  it.each([
    ["/mentions-legales", "Mentions légales"],
    ["/accessibilite", "Accessibilité"],
    ["/confidentialite", "Confidentialité"],
    ["/contact", "Contact Support"],
  ])("links %s -> %s", (href, label) => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", href);
  });
});
