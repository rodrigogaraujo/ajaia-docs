"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ACCEPTED_EXTENSIONS,
  IMPORT_MAX_BYTES,
  extensionOf,
  isAcceptedExtension,
} from "@/lib/import-rules";

const ACCEPTED_LABEL = ACCEPTED_EXTENSIONS.join(", ");
const LIMIT_LABEL = `${IMPORT_MAX_BYTES / (1024 * 1024)}MB`;

export function ImportFile() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    if (!isAcceptedExtension(extensionOf(file.name))) {
      setError(`Unsupported file type. Accepted: ${ACCEPTED_LABEL}`);
      return;
    }
    if (file.size === 0) {
      setError("That file is empty");
      return;
    }
    if (file.size > IMPORT_MAX_BYTES) {
      setError(`That file is larger than ${LIMIT_LABEL}`);
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/import", { method: "POST", body });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "Could not import that file");
        return;
      }
      router.push(`/documents/${payload.document.id}`);
    } catch {
      setError("Could not import that file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-3">
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={onPick}
          className="hidden"
          aria-label="Import file"
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        >
          {busy ? "Importing…" : "Import file"}
        </button>
        <span className="text-xs opacity-60">
          {ACCEPTED_LABEL} · up to {LIMIT_LABEL}
        </span>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
