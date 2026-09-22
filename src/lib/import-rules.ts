export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export function extensionOf(fileName: string): string {
  const base = fileName.slice(fileName.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot).toLowerCase();
}

export function isAcceptedExtension(
  extension: string,
): extension is AcceptedExtension {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
}
