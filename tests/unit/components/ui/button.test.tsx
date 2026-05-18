import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
  });

  it("applies primary gradient by default", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button")).toHaveClass("gradient-primary");
  });

  it("applies danger variant classes", () => {
    render(<Button variant="danger">Supprimer</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-error");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Big</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-8");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards refs", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Y</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("merges custom className", () => {
    render(<Button className="extra-class">X</Button>);
    expect(screen.getByRole("button")).toHaveClass("extra-class");
  });
});
