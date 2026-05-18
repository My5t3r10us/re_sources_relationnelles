import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>contenu</Card>);
    expect(screen.getByText("contenu")).toBeInTheDocument();
  });

  it("applies hover classes when hover=true", () => {
    const { container } = render(<Card hover>x</Card>);
    expect(container.firstChild).toHaveClass("hover:shadow-ambient");
  });

  it("does not apply hover classes by default", () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).not.toHaveClass("hover:shadow-ambient");
  });
});
