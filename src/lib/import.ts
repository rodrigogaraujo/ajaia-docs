import mammoth from "mammoth";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { DEFAULT_DOCUMENT_TITLE, TITLE_MAX_LENGTH } from "@/lib/documents";
import { ALLOWED_TAGS, sanitizeDocumentHtml } from "@/lib/sanitize";

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export class UnsupportedFileType extends Error {}
export class ConversionFailed extends Error {}

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

export function titleFromFileName(fileName: string): string {
  const base = fileName.slice(fileName.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  const withoutExtension = dot >= 0 ? base.slice(0, dot) : base;
  const trimmed = withoutExtension.trim().replace(/\s+/g, " ");
  if (!trimmed) return DEFAULT_DOCUMENT_TITLE;
  return trimmed.slice(0, TITLE_MAX_LENGTH).trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

const DEEPER_HEADINGS = ["h3", "h4", "h5", "h6"];
const BECOMES_PARAGRAPH = ["blockquote", "pre", "code", "td", "th", "dd", "dt"];

export function normalizeToEditorHtml(html: string): string {
  const transformTags: sanitizeHtml.IOptions["transformTags"] = {};
  for (const tag of DEEPER_HEADINGS) transformTags[tag] = "h2";
  for (const tag of BECOMES_PARAGRAPH) transformTags[tag] = "p";

  const demoted = sanitizeHtml(html, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {},
    transformTags,
    nonTextTags: ["script", "style", "textarea", "option", "img"],
  });

  return sanitizeDocumentHtml(demoted)
    .replace(/<p>\s*<\/p>/g, "")
    .trim();
}

export async function fileToHtml(
  fileName: string,
  buffer: Buffer,
): Promise<string> {
  const extension = extensionOf(fileName);
  if (!isAcceptedExtension(extension)) {
    throw new UnsupportedFileType(`Unsupported file type: ${extension || fileName}`);
  }

  try {
    if (extension === ".txt") {
      return normalizeToEditorHtml(textToHtml(buffer.toString("utf8")));
    }
    if (extension === ".md") {
      return normalizeToEditorHtml(await marked.parse(buffer.toString("utf8")));
    }
    const { value } = await mammoth.convertToHtml({ buffer });
    return normalizeToEditorHtml(value);
  } catch (error) {
    if (error instanceof UnsupportedFileType) throw error;
    throw new ConversionFailed(
      error instanceof Error ? error.message : "Could not convert this file",
    );
  }
}
