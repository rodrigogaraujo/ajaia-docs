export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const SAVE_DEBOUNCE_MS = 800;

export const SAVE_STATUS_LABELS: Record<Exclude<SaveStatus, "idle">, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Error saving – retry",
};

export function saveStatusLabel(status: SaveStatus): string | null {
  return status === "idle" ? null : SAVE_STATUS_LABELS[status];
}
