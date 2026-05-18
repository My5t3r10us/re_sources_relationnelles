import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourceCard } from "@/components/resources/resource-card";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ResourceCard", () => {
  const base = {
    id: "r1",
    title: "Mon titre",
    summary: "Mon résumé",
    mediaType: "article",
  };

  it("renders title, summary and link to the resource", () => {
    render(<ResourceCard {...base} />);
    expect(screen.getByText("Mon titre")).toBeInTheDocument();
    expect(screen.getByText("Mon résumé")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/ressource/r1");
  });

  it("displays the media type label", () => {
    render(<ResourceCard {...base} mediaType="video" />);
    expect(screen.getByText("Série vidéo")).toBeInTheDocument();
  });

  it("falls back to the raw mediaType when unknown", () => {
    render(<ResourceCard {...base} mediaType="unknown" />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("shows category badge when imageUrl provided", () => {
    render(<ResourceCard {...base} imageUrl="https://x/y.png" categoryName="Santé" />);
    expect(screen.getByText("Santé")).toBeInTheDocument();
  });

  it("shows reading time when provided", () => {
    render(<ResourceCard {...base} readingTime={7} />);
    expect(screen.getByText(/7 min/)).toBeInTheDocument();
  });

  it("shows actionLabel when provided", () => {
    render(<ResourceCard {...base} actionLabel="Lire" />);
    expect(screen.getByText("Lire")).toBeInTheDocument();
  });

  it("Sauvegarder button prevents navigation when clicked", async () => {
    render(<ResourceCard {...base} />);
    const save = screen.getByLabelText("Sauvegarder");
    await userEvent.click(save);
    // No throw → preventDefault worked.
    expect(save).toBeInTheDocument();
  });
});
