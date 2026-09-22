import { readFileSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";

const TITLE = `[e2e] Export ${Date.now()}`;

const EMAILS = {
  alice: "alice@ajaia.test",
  bob: "bob@ajaia.test",
};

async function signIn(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.click(`button:has-text("${email}")`);
  await page.waitForURL((url) => new URL(url).pathname === "/");
  await page.waitForSelector('button:has-text("New document")');
  return page;
}

async function settle(page: Page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading document"),
  );
}

async function exportMarkdown(page: Page) {
  const pending = page.waitForEvent("download");
  await page.click('button:has-text("Export .md")');
  const download = await pending;
  const file = await download.path();
  return {
    filename: download.suggestedFilename(),
    markdown: readFileSync(file, "utf8"),
  };
}

test("an exported document carries its headings and list items", async ({
  browser,
}) => {
  const alice = await signIn(browser, EMAILS.alice);
  let documentUrl = "";

  await test.step("Alice creates a document with headings and both list kinds", async () => {
    await alice.click('button:has-text("New document")');
    await alice.waitForURL(/\/documents\/.+/);
    documentUrl = alice.url();

    const title = alice.locator('input[aria-label="Document title"]');
    await title.waitFor();
    await title.fill(TITLE);
    await title.press("Enter");
    await expect(alice.getByRole("status")).toHaveText("Saved");

    const editor = alice.locator(".ProseMirror");
    await editor.click();

    await alice.click('button:has-text("H1")');
    await alice.keyboard.type("Export heading", { delay: 20 });
    await alice.keyboard.press("Enter");

    await alice.click('button:has-text("H2")');
    await alice.keyboard.type("Second section", { delay: 20 });
    await alice.keyboard.press("Enter");

    await alice.click('button:has-text("Bullets")');
    await alice.keyboard.type("first bullet", { delay: 20 });
    await alice.keyboard.press("Enter");
    await alice.keyboard.type("second bullet", { delay: 20 });

    await expect(editor.locator("h1")).toHaveText("Export heading");
    await expect(editor.locator("h2")).toHaveText("Second section");
    await expect(editor.locator("ul li")).toHaveCount(2);
    await expect(alice.getByRole("status")).toHaveText("Saved");
  });

  await test.step("the downloaded file is named after the document", async () => {
    const { filename } = await exportMarkdown(alice);
    expect(filename).toBe(`${TITLE}.md`);
  });

  await test.step("the downloaded file carries the headings and the list items", async () => {
    const { markdown } = await exportMarkdown(alice);
    expect(markdown).toContain("# Export heading");
    expect(markdown).toContain("## Second section");
    expect(markdown).toMatch(/^- +first bullet$/m);
    expect(markdown).toMatch(/^- +second bullet$/m);
    expect(markdown).not.toContain("<h1>");
    expect(markdown).not.toContain("<li>");
  });

  await test.step("a share recipient can export, though he cannot share or delete", async () => {
    await alice.click('button:has-text("Share")');
    const dialog = alice.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await alice.fill("#share-email", EMAILS.bob);
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toContainText("Bob");
    await alice.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    const bob = await signIn(browser, EMAILS.bob);
    await bob.goto(documentUrl);
    await settle(bob);
    await expect(bob.locator("body")).toContainText("Shared by Alice");
    await expect(bob.locator('button:has-text("Share")')).toHaveCount(0);
    await expect(bob.locator('button:has-text("Delete")')).toHaveCount(0);
    await expect(bob.locator('button:has-text("Export .md")')).toHaveCount(1);

    const { filename, markdown } = await exportMarkdown(bob);
    expect(filename).toBe(`${TITLE}.md`);
    expect(markdown).toContain("# Export heading");
    expect(markdown).toMatch(/^- +first bullet$/m);
    await bob.context().close();
  });

  await test.step("the document this test created is removed", async () => {
    await alice.goto(documentUrl);
    await settle(alice);
    await alice.click('button:has-text("Delete")');
    await alice.click('button:has-text("Confirm delete")');
    await alice.waitForURL((url) => new URL(url).pathname === "/");
    await expect(alice.locator("body")).not.toContainText(TITLE);
    await alice.context().close();
  });
});
