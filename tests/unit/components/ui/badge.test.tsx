import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Nouveau</Badge>);
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
  });

  it("applies primary variant styles by default", () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.firstChild).toHaveClass("text-primary");
  });

  it("supports all variants without crashing", () => {
    for (const v of ["primary", "secondary", "tertiary", "error", "success", "outline"] as const) {
      const { unmount } = render(<Badge variant={v}>x</Badge>);
      unmount();
    }
  });

  it("renders a dot when dot=true", () => {
    const { container } = render(<Badge dot>x</Badge>);
    expect(container.querySelector("span.rounded-full")).toBeInTheDocument();
  });
});
