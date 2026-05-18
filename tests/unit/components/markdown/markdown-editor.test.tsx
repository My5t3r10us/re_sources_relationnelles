import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";

function Wrapper() {
  const [value, setValue] = (require("react") as typeof import("react")).useState("");
  return <MarkdownEditor value={value} onChange={setValue} />;
}

describe("MarkdownEditor", () => {
  it("renders textarea and toolbar buttons", () => {
    render(<MarkdownEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByTitle("Gras")).toBeInTheDocument();
    expect(screen.getByTitle("Italique")).toBeInTheDocument();
    expect(screen.getByTitle("Titre 1")).toBeInTheDocument();
    expect(screen.getByTitle("Tableau")).toBeInTheDocument();
  });

  it("calls onChange when user types", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "abc");
    expect(onChange).toHaveBeenCalled();
  });

  it("wraps with **bold** placeholder when clicking Gras with empty selection", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Gras"));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("**texte en gras**"));
  });

  it("inserts H1 prefix when clicking Titre 1", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Titre 1"));
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^# /));
  });

  it("inserts a separator '---' when clicking Séparateur", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="x" onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Séparateur"));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("---"));
  });

  it("inserts image markdown when clicking Image", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Image"));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("![description](url-image)"));
  });

  it("inserts table markdown when clicking Tableau", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Tableau"));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("| Colonne 1 |"));
  });

  it("accumulates state changes when controlled correctly", async () => {
    render(<Wrapper />);
    await userEvent.click(screen.getByTitle("Liste à puces"));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toMatch(/^- /);
  });
});
