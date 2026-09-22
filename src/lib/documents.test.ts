import { describe, expect, it } from "vitest";
import {
  CONTENT_MAX_BYTES,
  createDocumentSchema,
  updateDocumentSchema,
} from "@/lib/documents";
import { sanitizeDocumentHtml } from "@/lib/sanitize";

describe("title validation", () => {
  it("trims a padded title", () => {
    const parsed = updateDocumentSchema.parse({ title: "  Meeting notes  " });
    expect(parsed.title).toBe("Meeting notes");
  });

  it("rejects a whitespace-only title", () => {
    expect(updateDocumentSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("accepts 120 characters and rejects 121", () => {
    expect(updateDocumentSchema.safeParse({ title: "x".repeat(120) }).success).toBe(true);
    expect(updateDocumentSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
  });

  it("allows creating without a title", () => {
    expect(createDocumentSchema.safeParse({}).success).toBe(true);
  });
});

describe("update validation", () => {
  it("rejects an update supplying neither field", () => {
    expect(updateDocumentSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a title-only and a content-only update", () => {
    expect(updateDocumentSchema.safeParse({ title: "Notes" }).success).toBe(true);
    expect(updateDocumentSchema.safeParse({ contentHtml: "<p>hi</p>" }).success).toBe(true);
  });

  it("rejects content over the size limit", () => {
    const tooBig = "a".repeat(CONTENT_MAX_BYTES + 1);
    expect(updateDocumentSchema.safeParse({ contentHtml: tooBig }).success).toBe(false);
  });
});

describe("sanitizeDocumentHtml", () => {
  it("strips script elements", () => {
    const out = sanitizeDocumentHtml("<p>ok</p><script>alert(1)</script>");
    expect(out).not.toContain("script");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips event handler attributes", () => {
    const out = sanitizeDocumentHtml('<p onclick="steal()">ok</p>');
    expect(out).not.toContain("onclick");
    expect(out).toContain("ok");
  });

  it("strips tags outside the allowlist", () => {
    const out = sanitizeDocumentHtml('<iframe src="evil"></iframe><a href="/x">link</a>');
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("<a");
  });

  it("preserves every format the toolbar produces", () => {
    const editorOutput = [
      "<h1>Heading one</h1>",
      "<h2>Heading two</h2>",
      "<p><strong>bold</strong> <em>italic</em> <u>underline</u></p>",
      "<ul><li>bullet</li></ul>",
      "<ol><li>numbered</li></ol>",
      "<p>line<br />break</p>",
    ].join("");

    const out = sanitizeDocumentHtml(editorOutput);

    for (const tag of ["h1", "h2", "strong", "em", "u", "ul", "ol", "li", "p", "br"]) {
      expect(out, `expected <${tag}> to survive sanitization`).toContain(`<${tag}`);
    }
    expect(out).toContain("Heading one");
    expect(out).toContain("numbered");
  });
});
