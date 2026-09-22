import { DEFAULT_DOCUMENT_TITLE } from "@/lib/documents";

const RESERVED_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

export function markdownFileName(title: string): string {
  const cleaned = title
    .replace(RESERVED_FILENAME_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned || DEFAULT_DOCUMENT_TITLE}.md`;
}

export async function htmlToMarkdown(html: string): Promise<string> {
  if (!html.trim()) return "";
  const { default: TurndownService } = await import("turndown");
  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    emDelimiter: "_",
    strongDelimiter: "**",
  });
  return service.turndown(html).trim();
}
