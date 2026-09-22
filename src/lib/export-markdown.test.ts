import { describe, expect, it } from "vitest";
import { DEFAULT_DOCUMENT_TITLE } from "@/lib/documents";
import { htmlToMarkdown, markdownFileName } from "@/lib/export-markdown";

describe("htmlToMarkdown", () => {
  it("converts headings by level", async () => {
    const markdown = await htmlToMarkdown("<h1>Title</h1><h2>Section</h2>");
    expect(markdown).toContain("# Title");
    expect(markdown).toContain("## Section");
  });

  it("converts bold and italic", async () => {
    const markdown = await htmlToMarkdown(
      "<p><strong>bold</strong> and <em>italic</em></p>",
    );
    expect(markdown).toContain("**bold**");
    expect(markdown).toContain("_italic_");
  });

  it("converts bulleted list items", async () => {
    const markdown = await htmlToMarkdown("<ul><li>first</li><li>second</li></ul>");
    expect(markdown).toMatch(/^- +first$/m);
    expect(markdown).toMatch(/^- +second$/m);
  });

  it("converts numbered list items", async () => {
    const markdown = await htmlToMarkdown("<ol><li>first</li><li>second</li></ol>");
    expect(markdown).toMatch(/^1\. +first$/m);
    expect(markdown).toMatch(/^2\. +second$/m);
  });

  it("keeps separate paragraphs apart", async () => {
    const markdown = await htmlToMarkdown("<p>one</p><p>two</p>");
    expect(markdown).toBe("one\n\ntwo");
  });

  it("emits underlined text without an HTML tag", async () => {
    const markdown = await htmlToMarkdown("<p><u>underlined</u></p>");
    expect(markdown).toContain("underlined");
    expect(markdown).not.toContain("<u>");
  });

  it("returns an empty string for empty content", async () => {
    expect(await htmlToMarkdown("")).toBe("");
    expect(await htmlToMarkdown("   ")).toBe("");
  });
});

describe("markdownFileName", () => {
  it("names the file after the title", () => {
    expect(markdownFileName("Quarterly report")).toBe("Quarterly report.md");
  });

  it("replaces characters a filesystem reserves", () => {
    const name = markdownFileName("Q1/Q2: notes");
    expect(name).toBe("Q1 Q2 notes.md");
    expect(name).not.toMatch(RESERVED);
  });

  it("falls back when the title reduces to nothing", () => {
    expect(markdownFileName("   ")).toBe(`${DEFAULT_DOCUMENT_TITLE}.md`);
    expect(markdownFileName("///")).toBe(`${DEFAULT_DOCUMENT_TITLE}.md`);
  });

  it("never returns a bare extension", () => {
    for (const title of ["", " ", "::", "?*|"]) {
      expect(markdownFileName(title)).not.toBe(".md");
    }
  });
});

const RESERVED = /[\\/:*?"<>|]/;
