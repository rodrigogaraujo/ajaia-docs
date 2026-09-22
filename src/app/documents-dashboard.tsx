"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { formatUpdatedAt } from "@/lib/format";

type DocumentRow = {
  id: string;
  title: string;
  updatedAt: string;
  owner: { name: string };
  role: "owner" | "shared";
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; documents: DocumentRow[] };

function Section({
  heading,
  documents,
  emptyLabel,
  onOpen,
}: {
  heading: string;
  documents: DocumentRow[];
  emptyLabel: string;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
        {heading}
      </h2>
      {documents.length === 0 ? (
        <p className="text-sm opacity-60">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onOpen(doc.id)}
                className="w-full rounded-lg border border-black/15 px-4 py-3 text-left transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                <span className="block font-medium">{doc.title}</span>
                <span className="block text-sm opacity-60">
                  {doc.owner.name} · updated {formatUpdatedAt(doc.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DocumentsDashboard() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [creating, startCreating] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Could not load your documents.");
      const body = await response.json();
      setState({ status: "ready", documents: body.documents });
    } catch {
      setState({ status: "error", message: "Could not load your documents." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openDocument = useCallback(
    (id: string) => router.push(`/documents/${id}`),
    [router],
  );

  function createDocument() {
    setCreateError(null);
    startCreating(async () => {
      try {
        const response = await fetch("/api/documents", { method: "POST" });
        if (!response.ok) throw new Error();
        const body = await response.json();
        router.push(`/documents/${body.document.id}`);
      } catch {
        setCreateError("Could not create a document. Try again.");
      }
    });
  }

  if (state.status === "loading") {
    return <p className="text-sm opacity-60">Loading your documents…</p>;
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="text-sm text-red-600">{state.message}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Retry
        </button>
      </div>
    );
  }

  const owned = state.documents.filter((doc) => doc.role === "owner");
  const shared = state.documents.filter((doc) => doc.role === "shared");
  const nothingAtAll = owned.length === 0 && shared.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={createDocument}
          disabled={creating}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {creating ? "Creating…" : "New document"}
        </button>
        {createError ? (
          <p role="alert" className="text-sm text-red-600">
            {createError}
          </p>
        ) : null}
      </div>

      {nothingAtAll ? (
        <div className="rounded-lg border border-dashed border-black/20 px-6 py-10 text-center dark:border-white/25">
          <p className="font-medium">No documents yet</p>
          <p className="mt-1 text-sm opacity-60">
            Create your first document to get started.
          </p>
        </div>
      ) : (
        <>
          <Section
            heading="My documents"
            documents={owned}
            emptyLabel="You have not created any documents yet."
            onOpen={openDocument}
          />
          <Section
            heading="Shared with me"
            documents={shared}
            emptyLabel="Nothing has been shared with you yet."
            onOpen={openDocument}
          />
        </>
      )}
    </div>
  );
}
