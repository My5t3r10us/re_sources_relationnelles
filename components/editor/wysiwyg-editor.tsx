"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-on-surface/10 text-on-surface"
          : "text-on-surface-variant/50 hover:text-on-surface hover:bg-on-surface/5"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-black/8 pb-2 mb-4">
      {/* Titres */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Titre 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Titre 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Titre 3"
      >
        H3
      </ToolbarButton>

      <span className="w-px h-4 bg-black/10 mx-1" />

      {/* Mise en forme */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Gras (Ctrl+B)"
      >
        <strong>G</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italique (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Barré"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Code inline"
      >
        {"<>"}
      </ToolbarButton>

      <span className="w-px h-4 bg-black/10 mx-1" />

      {/* Listes */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Liste à puces"
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Liste numérotée"
      >
        1≡
      </ToolbarButton>

      <span className="w-px h-4 bg-black/10 mx-1" />

      {/* Blocs */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Citation"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Bloc de code"
      >
        {"{ }"}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Séparateur"
      >
        ―
      </ToolbarButton>

      <span className="w-px h-4 bg-black/10 mx-1" />

      {/* Historique */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        active={false}
        title="Annuler (Ctrl+Z)"
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        active={false}
        title="Rétablir (Ctrl+Y)"
      >
        ↪
      </ToolbarButton>
    </div>
  );
}

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "Commencez à rédiger votre ressource...",
}: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown: string = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class:
          "wysiwyg-content min-h-[280px] outline-none text-on-surface leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value resets (e.g. form clear)
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: string = (editor.storage as any).markdown.getMarkdown();
    if (value === "" && current !== "") {
      editor.commands.clearContent();
    }
  }, [value, editor]);

  return (
    <div className="wysiwyg-wrapper">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
