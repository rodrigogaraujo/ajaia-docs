"use client";

import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { saveStatusLabel } from "@/lib/save-status";
import { EditorToolbar } from "./editor-toolbar";
import { DeleteDocument } from "./delete-document";
import { ExportButton } from "./export-button";
import { ShareDialog } from "./share-dialog";
import { useDocumentSave } from "./use-document-save";

type LoadedDocument = {
  id: string;
  title: string;
  contentHtml: string;
  ownerName: string;
  role: "owner" | "shared";
};

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "forbidden" }
  | { status: "error" }
  | { status: "ready"; document: LoadedDocument };

const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2] },
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    link: false,
  }),
];

function TitleField({
  title,
  onCommit,
}: {
  title: string;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(title);
  const [lastTitle, setLastTitle] = useState(title);

  if (title !== lastTitle) {
    setLastTitle(title);
    setDraft(title);
  }

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(title);
      return;
    }
    if (trimmed !== title) onCommit(trimmed);
    setDraft(trimmed);
  }

  return (
    <input
      aria-label="Document title"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(title);
          event.currentTarget.blur();
        }
      }}
      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold outline-none transition hover:border-black/15 focus:border-black/30 dark:hover:border-white/20 dark:focus:border-white/40"
    />
  );
}

export function DocumentEditor({ documentId }: { documentId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [sharing, setSharing] = useState(false);
  const { status: saveStatus, queue, saveNow, retry } = useDocumentSave(documentId);

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[24rem] w-full outline-none [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
      },
    },
    onUpdate: ({ editor: current }) => queue({ contentHtml: current.getHTML() }),
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (response.status === 403) {
          if (!cancelled) setState({ status: "forbidden" });
          return;
        }
        if (response.status === 404) {
          if (!cancelled) setState({ status: "missing" });
          return;
        }
        if (!response.ok) throw new Error();
        const body = await response.json();
        if (cancelled) return;
        setState({ status: "ready", document: body.document });
        editor?.commands.setContent(body.document.contentHtml || "", {
          emitUpdate: false,
        });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    if (editor) void load();
    return () => {
      cancelled = true;
    };
  }, [documentId, editor]);

  if (state.status === "loading") {
    return <p className="text-sm opacity-60">Loading document…</p>;
  }

  if (state.status === "forbidden") {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="font-medium">This document is not available to you.</p>
        <p className="text-sm opacity-60">
          Ask its owner to share it with you.
        </p>
        <Link href="/" className="text-sm underline">
          Back to documents
        </Link>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="font-medium">This document does not exist.</p>
        <p className="text-sm opacity-60">It may have been deleted.</p>
        <Link href="/" className="text-sm underline">
          Back to documents
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600">Could not load this document.</p>
        <Link href="/" className="text-sm underline">
          Back to documents
        </Link>
      </div>
    );
  }

  const label = saveStatusLabel(saveStatus);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <TitleField
            title={state.document.title}
            onCommit={(next) => {
              setState({ status: "ready", document: { ...state.document, title: next } });
              saveNow({ title: next });
            }}
          />
          <p className="px-2 text-sm">
            <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs font-medium dark:bg-white/10">
              {state.document.role === "owner"
                ? "Owner"
                : `Shared by ${state.document.ownerName}`}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <ExportButton
            title={state.document.title}
            getHtml={() => editor?.getHTML() ?? ""}
          />
          {state.document.role === "owner" ? (
            <>
              <button
                type="button"
                onClick={() => setSharing(true)}
                className="rounded-md border border-black/15 px-3 py-1 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Share
              </button>
              <DeleteDocument documentId={documentId} />
            </>
          ) : null}
          {label ? (
            <span
              role="status"
              className={`text-sm ${saveStatus === "error" ? "text-red-600" : "opacity-60"}`}
            >
              {label}
            </span>
          ) : null}
          {saveStatus === "error" ? (
            <button
              type="button"
              onClick={retry}
              className="rounded-md border border-black/15 px-2 py-1 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>

      {editor ? <EditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />

      {sharing ? (
        <ShareDialog documentId={documentId} onClose={() => setSharing(false)} />
      ) : null}
    </div>
  );
}
