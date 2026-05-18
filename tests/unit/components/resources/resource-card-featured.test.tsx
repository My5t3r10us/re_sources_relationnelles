import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedResourceCard } from "@/components/resources/resource-card-featured";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("FeaturedResourceCard", () => {
  const base = { id: "r1", title: "T", summary: "S", mediaType: "article" };

  it("renders title and a link to the resource", () => {
    render(<FeaturedResourceCard {...base} />);
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/ressource/r1");
  });

  it("shows 'À la une' badge", () => {
    render(<FeaturedResourceCard {...base} />);
    expect(screen.getByText(/À la une/i)).toBeInTheDocument();
  });

  it("renders 'Exercice' label when mediaType=exercise instead of category", () => {
    render(<FeaturedResourceCard {...base} mediaType="exercise" categoryName="Santé" />);
    expect(screen.getByText("Exercice")).toBeInTheDocument();
  });

  it("renders categoryName otherwise", () => {
    render(<FeaturedResourceCard {...base} categoryName="Famille" />);
    expect(screen.getByText("Famille")).toBeInTheDocument();
  });

  it("default actionLabel is 'Commencer'", () => {
    render(<FeaturedResourceCard {...base} />);
    expect(screen.getByText("Commencer")).toBeInTheDocument();
  });

  it("respects custom actionLabel", () => {
    render(<FeaturedResourceCard {...base} actionLabel="Démarrer" />);
    expect(screen.getByText("Démarrer")).toBeInTheDocument();
  });

  it("shows reading time when provided", () => {
    render(<FeaturedResourceCard {...base} readingTime={5} />);
    expect(screen.getByText(/5 min/)).toBeInTheDocument();
  });
});
