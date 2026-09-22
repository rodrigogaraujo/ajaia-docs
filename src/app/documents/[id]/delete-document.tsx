"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteDocument({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not delete. Try again.");
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div className="flex items-center gap-2">
        {error ? (
          <span role="alert" className="text-sm text-red-600">
            {error}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md border border-black/15 px-3 py-1 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div role="alertdialog" aria-label="Confirm delete" className="flex items-center gap-2">
      <span className="text-sm">Delete this document?</span>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="rounded-md border border-black/15 px-3 py-1 text-sm transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
      >
        Cancel
      </button>
    </div>
  );
}
