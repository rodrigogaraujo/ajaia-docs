import { expect, test, type Browser, type Page } from "@playwright/test";

const TITLE = `[e2e] Sharing ${Date.now()}`;

const EMAILS = {
  alice: "alice@ajaia.test",
  bob: "bob@ajaia.test",
  carol: "carol@ajaia.test",
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

test("a document is shared with one user and withheld from another", async ({
  browser,
}) => {
  const alice = await signIn(browser, EMAILS.alice);
  let documentUrl = "";

  await test.step("Alice creates a document and titles it", async () => {
    await alice.click('button:has-text("New document")');
    await alice.waitForURL(/\/documents\/.+/);
    documentUrl = alice.url();
    const title = alice.locator('input[aria-label="Document title"]');
    await title.waitFor();
    await title.fill(TITLE);
    await title.press("Enter");
    await expect(alice.getByRole("status")).toHaveText("Saved");
  });

  await test.step("Alice types text and makes it bold", async () => {
    const editor = alice.locator(".ProseMirror");
    await editor.click();
    await alice.keyboard.type("shared paragraph", { delay: 30 });
    await alice.keyboard.press("ControlOrMeta+A");
    await alice.click('button:has-text("Bold")');
    await alice.waitForTimeout(150);
    await expect(editor.locator("strong")).toHaveText("shared paragraph");
    await expect(alice.locator('button:has-text("Bold")')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(alice.getByRole("status")).toHaveText("Saved");
  });

  await test.step("Alice shares it with Bob through the dialog", async () => {
    await alice.click('button:has-text("Share")');
    const dialog = alice.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Not shared with anyone yet");
    await alice.fill("#share-email", EMAILS.bob);
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toContainText("Bob");
    await alice.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  await test.step("Bob finds it under Shared with me and can edit it", async () => {
    const bob = await signIn(browser, EMAILS.bob);
    const shared = bob.locator("section", { hasText: "Shared with me" });
    await expect(shared).toContainText(TITLE);
    await expect(shared).toContainText("Alice");

    await bob.click(`button:has-text("${TITLE}")`);
    await bob.waitForURL(new RegExp(documentUrl.split("/").pop() ?? ""));
    await settle(bob);
    await expect(bob.locator("body")).toContainText("Shared by Alice");
    await expect(bob.locator('button:has-text("Share")')).toHaveCount(0);
    await expect(bob.locator('button:has-text("Delete")')).toHaveCount(0);

    const editor = bob.locator(".ProseMirror");
    await editor.click();
    await bob.keyboard.press("ControlOrMeta+ArrowDown");
    await bob.keyboard.type(" edited by Bob", { delay: 30 });
    await expect(bob.getByRole("status")).toHaveText("Saved");

    await bob.reload();
    await settle(bob);
    await expect(bob.locator(".ProseMirror")).toContainText("edited by Bob");
    await bob.context().close();
  });

  await test.step("Carol is refused with 403 and never shown the document", async () => {
    const carol = await signIn(browser, EMAILS.carol);
    const status = await carol.evaluate(async (url) => {
      const id = url.split("/").pop();
      return (await fetch(`/api/documents/${id}`)).status;
    }, documentUrl);
    expect(status).toBe(403);

    await carol.goto(documentUrl);
    await settle(carol);
    await expect(carol.locator("body")).toContainText("not available to you");
    await expect(carol.locator("body")).not.toContainText(TITLE);
    await expect(carol.locator(".ProseMirror")).toHaveCount(0);
    await carol.context().close();
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
