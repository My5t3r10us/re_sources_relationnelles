import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/ui/select";

const opts = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("Select", () => {
  it("renders all options", () => {
    render(<Select options={opts} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders disabled placeholder", () => {
    render(<Select options={opts} placeholder="Choisir" defaultValue="" />);
    const ph = screen.getByText("Choisir") as HTMLOptionElement;
    expect(ph).toBeDisabled();
  });

  it("associates label", () => {
    render(<Select id="cat" label="Catégorie" options={opts} />);
    expect(screen.getByLabelText("Catégorie")).toBeInTheDocument();
  });

  it("fires onChange when user selects", async () => {
    const onChange = vi.fn();
    render(<Select options={opts} onChange={onChange} defaultValue="a" />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "b");
    expect(onChange).toHaveBeenCalled();
  });
});
