"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";

type ToolbarButton = {
  key: string;
  label: string;
  run: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
};

const BUTTONS: ToolbarButton[] = [
  {
    key: "bold",
    label: "Bold",
    run: (e) => e.chain().focus().toggleBold().run(),
    isActive: (e) => e.isActive("bold"),
  },
  {
    key: "italic",
    label: "Italic",
    run: (e) => e.chain().focus().toggleItalic().run(),
    isActive: (e) => e.isActive("italic"),
  },
  {
    key: "underline",
    label: "Underline",
    run: (e) => e.chain().focus().toggleUnderline().run(),
    isActive: (e) => e.isActive("underline"),
  },
  {
    key: "h1",
    label: "H1",
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e.isActive("heading", { level: 1 }),
  },
  {
    key: "h2",
    label: "H2",
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    key: "bulletList",
    label: "Bullets",
    run: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive("bulletList"),
  },
  {
    key: "orderedList",
    label: "Numbered",
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive("orderedList"),
  },
  {
    key: "undo",
    label: "Undo",
    run: (e) => e.chain().focus().undo().run(),
    isActive: () => false,
    isDisabled: (e) => !e.can().undo(),
  },
  {
    key: "redo",
    label: "Redo",
    run: (e) => e.chain().focus().redo().run(),
    isActive: () => false,
    isDisabled: (e) => !e.can().redo(),
  },
];

export function EditorToolbar({ editor }: { editor: Editor }) {
  const states = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      BUTTONS.map((button) => ({
        active: button.isActive(current),
        disabled: button.isDisabled?.(current) ?? false,
      })),
  });

  return (
    <div className="flex flex-wrap gap-1 border-b border-black/10 pb-3 dark:border-white/15">
      {BUTTONS.map((button, index) => {
        const state = states[index];
        return (
          <button
            key={button.key}
            type="button"
            aria-pressed={state.active}
            disabled={state.disabled}
            onClick={() => button.run(editor)}
            className={`rounded-md px-3 py-1.5 text-sm transition disabled:opacity-40 ${
              state.active
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
