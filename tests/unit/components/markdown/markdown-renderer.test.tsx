import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

describe("MarkdownRenderer", () => {
  it("renders a heading", () => {
    render(<MarkdownRenderer content="# Titre" />);
    expect(screen.getByRole("heading", { name: "Titre" })).toBeInTheDocument();
  });

  it("renders a paragraph", () => {
    render(<MarkdownRenderer content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a link with href", () => {
    render(<MarkdownRenderer content="[google](https://google.com)" />);
    const link = screen.getByRole("link", { name: "google" });
    expect(link).toHaveAttribute("href", "https://google.com");
  });

  it("renders gfm tables", () => {
    render(<MarkdownRenderer content={`| a | b |\n|---|---|\n| 1 | 2 |`} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
  });

  it("renders bullet list", () => {
    render(<MarkdownRenderer content={"- item 1\n- item 2"} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
