"use client";

import { useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  Minus,
  Table,
  CheckSquare,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement) => { text: string; cursorOffset: number };
  separator?: false;
}

interface ToolbarSeparator {
  separator: true;
}

type ToolbarItem = ToolbarAction | ToolbarSeparator;

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string
): { text: string; cursorOffset: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.substring(start, end) || placeholder;

  const newText =
    value.substring(0, start) + before + selected + after + value.substring(end);

  return {
    text: newText,
    cursorOffset: start + before.length + selected.length,
  };
}

function insertAtLine(
  textarea: HTMLTextAreaElement,
  prefix: string,
  placeholder: string
): { text: string; cursorOffset: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.substring(start, end) || placeholder;

  const newText =
    value.substring(0, start) + prefix + selected + value.substring(end);

  return {
    text: newText,
    cursorOffset: start + prefix.length + selected.length,
  };
}

const toolbarItems: ToolbarItem[] = [
  {
    icon: <Bold className="w-4 h-4" />,
    label: "Gras",
    action: (ta) => wrapSelection(ta, "**", "**", "texte en gras"),
  },
  {
    icon: <Italic className="w-4 h-4" />,
    label: "Italique",
    action: (ta) => wrapSelection(ta, "*", "*", "texte en italique"),
  },
  {
    icon: <Strikethrough className="w-4 h-4" />,
    label: "Barré",
    action: (ta) => wrapSelection(ta, "~~", "~~", "texte barré"),
  },
  { separator: true },
  {
    icon: <Heading1 className="w-4 h-4" />,
    label: "Titre 1",
    action: (ta) => insertAtLine(ta, "# ", "Titre"),
  },
  {
    icon: <Heading2 className="w-4 h-4" />,
    label: "Titre 2",
    action: (ta) => insertAtLine(ta, "## ", "Titre"),
  },
  {
    icon: <Heading3 className="w-4 h-4" />,
    label: "Titre 3",
    action: (ta) => insertAtLine(ta, "### ", "Titre"),
  },
  { separator: true },
  {
    icon: <List className="w-4 h-4" />,
    label: "Liste à puces",
    action: (ta) => insertAtLine(ta, "- ", "élément"),
  },
  {
    icon: <ListOrdered className="w-4 h-4" />,
    label: "Liste numérotée",
    action: (ta) => insertAtLine(ta, "1. ", "élément"),
  },
  {
    icon: <CheckSquare className="w-4 h-4" />,
    label: "Liste de tâches",
    action: (ta) => insertAtLine(ta, "- [ ] ", "tâche"),
  },
  { separator: true },
  {
    icon: <Quote className="w-4 h-4" />,
    label: "Citation",
    action: (ta) => insertAtLine(ta, "> ", "citation"),
  },
  {
    icon: <Code className="w-4 h-4" />,
    label: "Code",
    action: (ta) => wrapSelection(ta, "`", "`", "code"),
  },
  {
    icon: <Minus className="w-4 h-4" />,
    label: "Séparateur",
    action: (ta) => {
      const start = ta.selectionStart;
      const value = ta.value;
      const newText =
        value.substring(0, start) + "\n---\n" + value.substring(start);
      return { text: newText, cursorOffset: start + 5 };
    },
  },
  { separator: true },
  {
    icon: <Link className="w-4 h-4" />,
    label: "Lien",
    action: (ta) => {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;
      const selected = value.substring(start, end) || "texte du lien";
      const newText =
        value.substring(0, start) +
        `[${selected}](url)` +
        value.substring(end);
      return { text: newText, cursorOffset: start + selected.length + 3 };
    },
  },
  {
    icon: <ImageIcon className="w-4 h-4" />,
    label: "Image",
    action: (ta) => {
      const start = ta.selectionStart;
      const value = ta.value;
      const newText =
        value.substring(0, start) +
        "![description](url-image)" +
        value.substring(start);
      return { text: newText, cursorOffset: start + 26 };
    },
  },
  {
    icon: <Table className="w-4 h-4" />,
    label: "Tableau",
    action: (ta) => {
      const start = ta.selectionStart;
      const value = ta.value;
      const table =
        "\n| Colonne 1 | Colonne 2 | Colonne 3 |\n| --- | --- | --- |\n| cellule | cellule | cellule |\n";
      const newText = value.substring(0, start) + table + value.substring(start);
      return { text: newText, cursorOffset: start + table.length };
    },
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Rédigez votre contenu en markdown...",
  minHeight = "300px",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToolbarAction = useCallback(
    (action: ToolbarAction["action"]) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const result = action(textarea);
      onChange(result.text);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(result.cursorOffset, result.cursorOffset);
      });
    },
    [onChange]
  );

  return (
    <div className="rounded-xl border border-outline-variant/20 overflow-hidden bg-surface-container-lowest">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 bg-surface-container-high border-b border-outline-variant/20 flex-wrap">
        {toolbarItems.map((item, i) => {
          if ("separator" in item && item.separator) {
            return (
              <div
                key={`sep-${i}`}
                className="w-px h-5 bg-outline-variant/30 mx-1"
              />
            );
          }
          const action = item as ToolbarAction;
          return (
            <button
              key={action.label}
              type="button"
              title={action.label}
              onClick={() => handleToolbarAction(action.action)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              {action.icon}
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-on-surface placeholder:text-outline bg-transparent border-none focus:outline-none resize-y font-mono text-sm leading-relaxed"
        style={{ minHeight }}
      />
    </div>
  );
}
