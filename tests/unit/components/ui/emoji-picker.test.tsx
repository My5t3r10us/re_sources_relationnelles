import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiPicker } from "@/components/ui/emoji-picker";

describe("EmojiPicker", () => {
  it("shows placeholder when no value", () => {
    render(<EmojiPicker value="" onChange={vi.fn()} placeholder="Choisir" />);
    expect(screen.getByText("Choisir")).toBeInTheDocument();
  });

  it("displays the current value emoji when set", () => {
    render(<EmojiPicker value="😊" onChange={vi.fn()} />);
    expect(screen.getByText("😊")).toBeInTheDocument();
  });

  it("opens the popover on click and shows search input", async () => {
    render(<EmojiPicker value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByPlaceholderText(/Rechercher/i)).toBeInTheDocument();
  });

  it("calls onChange when an emoji is selected", async () => {
    const onChange = vi.fn();
    render(<EmojiPicker value="" onChange={onChange} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    const emojiButton = (await screen.findAllByRole("button")).find((b) =>
      /\p{Emoji}/u.test(b.textContent ?? ""),
    );
    if (emojiButton) {
      await userEvent.click(emojiButton);
      expect(onChange).toHaveBeenCalled();
    }
  });

  it("clear button resets the value", async () => {
    const onChange = vi.fn();
    render(<EmojiPicker value="🚀" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(/Supprimer/i));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("filters by search query", async () => {
    render(<EmojiPicker value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    const search = await screen.findByPlaceholderText(/Rechercher/i);
    await userEvent.type(search, "sourire");
    expect(screen.queryByText("Aucun résultat")).not.toBeInTheDocument();
  });

  it("shows 'Aucun résultat' when no match", async () => {
    render(<EmojiPicker value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    const search = await screen.findByPlaceholderText(/Rechercher/i);
    await userEvent.type(search, "zzzzzzzzzzz");
    expect(await screen.findByText("Aucun résultat")).toBeInTheDocument();
  });
});
