import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ConversionFailed,
  UnsupportedFileType,
  extensionOf,
  fileToHtml,
  normalizeToEditorHtml,
  titleFromFileName,
} from "@/lib/import";
import { ALLOWED_TAGS, sanitizeDocumentHtml } from "@/lib/sanitize";

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)));

const tagsIn = (html: string) => [
  ...new Set([...html.matchAll(/<\/?([a-z0-9]+)/g)].map((m) => m[1])),
];

describe("extensionOf", () => {
  it("reads the last extension, lowercased", () => {
    expect(extensionOf("notes.MD")).toBe(".md");
    expect(extensionOf("notes.2026.final.md")).toBe(".md");
  });

  it("returns empty for a name with no extension", () => {
    expect(extensionOf("README")).toBe("");
    expect(extensionOf(".gitignore")).toBe("");
  });
});

describe("titleFromFileName", () => {
  it("drops the extension", () => {
    expect(titleFromFileName("Quarterly report.docx")).toBe("Quarterly report");
  });

  it("keeps all but the last dotted segment", () => {
    expect(titleFromFileName("notes.2026.final.md")).toBe("notes.2026.final");
  });

  it("shortens an over-long name instead of failing", () => {
    const title = titleFromFileName(`${"x".repeat(300)}.txt`);
    expect(title.length).toBe(120);
  });

  it("falls back when nothing usable remains", () => {
    expect(titleFromFileName("   .txt")).toBe("Untitled document");
    expect(titleFromFileName(".txt")).toBe("Untitled document");
  });
});

describe("plain text conversion", () => {
  it("splits blank-line-separated blocks into paragraphs", async () => {
    const html = await fileToHtml("sample.txt", fixture("sample.txt"));
    expect(html.match(/<p>/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("escapes markup instead of interpreting it", async () => {
    const html = await fileToHtml("sample.txt", fixture("sample.txt"));
    expect(html).not.toContain("<script");
    expect(html).toContain("alert(1)");
    expect(html).toContain("5 &lt; 6");
  });
});

describe("markdown conversion", () => {
  it("preserves headings, emphasis and both list kinds", async () => {
    const html = await fileToHtml("sample.md", fixture("sample.md"));
    for (const tag of ["h1", "h2", "strong", "em", "ul", "ol", "li"]) {
      expect(html, `expected <${tag}>`).toContain(`<${tag}`);
    }
  });

  it("demotes a third-level heading to a heading, not bare text", async () => {
    const html = await fileToHtml("sample.md", fixture("sample.md"));
    expect(html).toMatch(/<h2>Heading three<\/h2>/);
  });

  it("keeps a block quote's text as a paragraph", async () => {
    const html = await fileToHtml("sample.md", fixture("sample.md"));
    expect(html).toContain("A quoted line.");
    expect(html).not.toContain("<blockquote");
  });

  it("keeps a link's words without the link", async () => {
    const html = await fileToHtml("sample.md", fixture("sample.md"));
    expect(html).toContain("a link");
    expect(html).not.toContain("<a ");
  });

  it("separates table cells into paragraphs rather than one run-on line", async () => {
    const html = await fileToHtml("sample.md", fixture("sample.md"));
    expect(html).toContain("<p>Cell A</p>");
    expect(html).toContain("<p>one</p>");
    expect(html).not.toContain("<table");
  });

  it("strips raw script embedded in markdown", async () => {
    const html = await fileToHtml("sample.md", fixture("sample.md"));
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert('md')");
  });
});

describe("docx conversion", () => {
  it("preserves headings, emphasis and both list kinds", async () => {
    const html = await fileToHtml("sample.docx", fixture("sample.docx"));
    for (const tag of ["h1", "h2", "strong", "em", "ul", "ol", "li"]) {
      expect(html, `expected <${tag}>`).toContain(`<${tag}`);
    }
    expect(html).toContain("Word heading one");
  });

  it("demotes the third-level Word heading", async () => {
    const html = await fileToHtml("sample.docx", fixture("sample.docx"));
    expect(html).toMatch(/<h2>Word heading three<\/h2>/);
  });
});

describe("failures", () => {
  it("rejects an unsupported extension", async () => {
    await expect(fileToHtml("notes.pdf", Buffer.from("x"))).rejects.toBeInstanceOf(
      UnsupportedFileType,
    );
  });

  it("reports a corrupt docx as a conversion failure, not a crash", async () => {
    await expect(
      fileToHtml("corrupt.docx", fixture("corrupt.docx")),
    ).rejects.toBeInstanceOf(ConversionFailed);
  });
});

describe("output stays inside the editor's vocabulary", () => {
  it.each(["sample.txt", "sample.md", "sample.docx"])(
    "%s produces only allowed tags, and survives the editor's sanitizer unchanged",
    async (name) => {
      const html = await fileToHtml(name, fixture(name));
      const disallowed = tagsIn(html).filter(
        (t) => !(ALLOWED_TAGS as readonly string[]).includes(t),
      );
      expect(disallowed, `disallowed tags: ${disallowed.join(",")}`).toEqual([]);
      expect(sanitizeDocumentHtml(html)).toBe(html);
    },
  );
});

describe("normalizeToEditorHtml", () => {
  it("drops images entirely, having no text to keep", () => {
    expect(normalizeToEditorHtml('<p>a<img src="x.png" alt="pic">b</p>')).toBe(
      "<p>ab</p>",
    );
  });

  it("removes event handler attributes", () => {
    expect(normalizeToEditorHtml('<p onclick="x()">hi</p>')).toBe("<p>hi</p>");
  });
});
