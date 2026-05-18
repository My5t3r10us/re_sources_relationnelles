import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@tiptap/react", () => ({
  useEditor: () => ({
    isActive: () => false,
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn() }),
        toggleItalic: () => ({ run: vi.fn() }),
        toggleStrike: () => ({ run: vi.fn() }),
        toggleHeading: () => ({ run: vi.fn() }),
        toggleBulletList: () => ({ run: vi.fn() }),
        toggleOrderedList: () => ({ run: vi.fn() }),
        toggleBlockquote: () => ({ run: vi.fn() }),
        toggleCodeBlock: () => ({ run: vi.fn() }),
        setHorizontalRule: () => ({ run: vi.fn() }),
        undo: () => ({ run: vi.fn() }),
        redo: () => ({ run: vi.fn() }),
      }),
    }),
    can: () => ({
      chain: () => ({
        focus: () => ({
          undo: () => ({ run: () => true }),
          redo: () => ({ run: () => true }),
          toggleBold: () => ({ run: () => true }),
          toggleItalic: () => ({ run: () => true }),
        }),
      }),
    }),
    storage: { markdown: { getMarkdown: () => "" } },
    commands: { setContent: vi.fn() },
    getHTML: () => "",
  }),
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock("@tiptap/starter-kit", () => ({ default: {} }));
vi.mock("@tiptap/extension-placeholder", () => ({ default: { configure: () => ({}) } }));
vi.mock("tiptap-markdown", () => ({ Markdown: { configure: () => ({}) } }));

import { WysiwygEditor } from "@/components/editor/wysiwyg-editor";

describe("WysiwygEditor", () => {
  it("renders the toolbar and editor area", () => {
    const { getByTestId } = render(<WysiwygEditor value="" onChange={vi.fn()} />);
    expect(getByTestId("editor-content")).toBeInTheDocument();
  });
});
