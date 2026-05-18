import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Textarea } from "@/components/ui/input";

describe("Input", () => {
  it("renders without label", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
  });

  it("associates label with input via htmlFor/id", () => {
    render(<Input id="myinput" label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "myinput");
  });

  it("displays error message when provided", () => {
    render(<Input error="Champ requis" />);
    expect(screen.getByText("Champ requis")).toBeInTheDocument();
  });

  it("fires onChange", async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "abc");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("Textarea", () => {
  it("renders label and accepts text", async () => {
    render(<Textarea id="bio" label="Bio" />);
    const ta = screen.getByLabelText("Bio");
    await userEvent.type(ta, "hello");
    expect(ta).toHaveValue("hello");
  });

  it("shows error", () => {
    render(<Textarea error="oups" />);
    expect(screen.getByText("oups")).toBeInTheDocument();
  });
});
