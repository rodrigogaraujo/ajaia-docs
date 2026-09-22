"use client";

import { useState } from "react";
import { htmlToMarkdown, markdownFileName } from "@/lib/export-markdown";

export function ExportButton({
  title,
  getHtml,
}: {
  title: string;
  getHtml: () => string;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function exportMarkdown() {
    setBusy(true);
    setFailed(false);
    try {
      const markdown = await htmlToMarkdown(getHtml());
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = markdownFileName(title);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={exportMarkdown}
        disabled={busy}
        className="rounded-md border border-black/15 px-3 py-1 text-sm transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
      >
        Export .md
      </button>
      {failed ? (
        <span role="alert" className="text-sm text-red-600">
          Could not export.
        </span>
      ) : null}
    </>
  );
}
