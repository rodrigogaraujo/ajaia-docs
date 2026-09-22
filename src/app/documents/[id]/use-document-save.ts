"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SAVE_DEBOUNCE_MS, type SaveStatus } from "@/lib/save-status";

type Payload = { title?: string; contentHtml?: string };

export function useDocumentSave(documentId: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef<Payload | null>(null);
  const inFlight = useRef(false);
  const lastFailed = useRef<Payload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    const payload = pending.current;
    if (!payload) return;

    pending.current = null;
    inFlight.current = true;
    setStatus("saving");

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("save failed");
      lastFailed.current = null;
      setStatus(pending.current ? "saving" : "saved");
    } catch {
      lastFailed.current = { ...payload, ...(pending.current ?? {}) };
      pending.current = null;
      setStatus("error");
    } finally {
      inFlight.current = false;
      if (pending.current) void flush();
    }
  }, [documentId]);

  const queue = useCallback(
    (payload: Payload) => {
      pending.current = { ...(pending.current ?? {}), ...payload };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const saveNow = useCallback(
    (payload: Payload) => {
      pending.current = { ...(pending.current ?? {}), ...payload };
      if (timer.current) clearTimeout(timer.current);
      void flush();
    },
    [flush],
  );

  const retry = useCallback(() => {
    const failed = lastFailed.current;
    if (!failed) return;
    lastFailed.current = null;
    saveNow(failed);
  }, [saveNow]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { status, queue, saveNow, retry };
}
