import sanitizeHtml from "sanitize-html";

export const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "h1",
  "h2",
  "ul",
  "ol",
  "li",
] as const;

export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}
