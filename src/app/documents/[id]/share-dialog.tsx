"use client";

import { useCallback, useEffect, useState } from "react";

type Person = { id: string; name: string; email: string };

type Access = { owner: Person; shares: Person[]; canManage: boolean };

const SEEDED_HINTS = ["alice@ajaia.test", "bob@ajaia.test", "carol@ajaia.test"];

const GRANT_ERRORS: Record<number, string> = {
  400: "That is your own address — you already own this document.",
  403: "Only the owner can share this document.",
  404: "No user with that email address.",
  409: "That person already has access.",
};

export function ShareDialog({
  documentId,
  onClose,
}: {
  documentId: string;
  onClose: () => void;
}) {
  const [access, setAccess] = useState<Access | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const response = await fetch(`/api/documents/${documentId}/shares`);
      if (!response.ok) throw new Error();
      setAccess(await response.json());
    } catch {
      setLoadError(true);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function grant(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError(GRANT_ERRORS[response.status] ?? "Could not share. Try again.");
        return;
      }
      setEmail("");
      await load();
    } catch {
      setError("Could not share. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userId: string) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/documents/${documentId}/shares/${userId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setError("Could not remove access. Try again.");
        return;
      }
      await load();
    } catch {
      setError("Could not remove access. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share document"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">Share</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-sm opacity-60 transition hover:opacity-100"
          >
            ✕
          </button>
        </div>

        {loadError ? (
          <p role="alert" className="mt-4 text-sm text-red-600">
            Could not load who has access.
          </p>
        ) : !access ? (
          <p className="mt-4 text-sm opacity-60">Loading…</p>
        ) : (
          <>
            {access.canManage ? (
              <form onSubmit={grant} className="mt-4 flex flex-col gap-2">
                <label htmlFor="share-email" className="text-sm font-medium">
                  Invite by email
                </label>
                <div className="flex gap-2">
                  <input
                    id="share-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@ajaia.test"
                    className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
                  >
                    Share
                  </button>
                </div>
                <p className="text-xs opacity-60">
                  Sign-in is mocked, so try one of: {SEEDED_HINTS.join(", ")}
                </p>
              </form>
            ) : null}

            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <ul className="mt-5 flex flex-col gap-2">
              <li className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{access.owner.name}</span>{" "}
                  <span className="opacity-60">{access.owner.email}</span>
                </span>
                <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                  Owner
                </span>
              </li>
              {access.shares.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{person.name}</span>{" "}
                    <span className="opacity-60">{person.email}</span>
                  </span>
                  {access.canManage ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => revoke(person.id)}
                      className="rounded-md border border-black/15 px-2 py-0.5 text-xs transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
              {access.shares.length === 0 ? (
                <li className="text-sm opacity-60">
                  Not shared with anyone yet.
                </li>
              ) : null}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
