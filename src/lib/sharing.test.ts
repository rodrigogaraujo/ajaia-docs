import { describe, expect, it } from "vitest";
import { canAccess, canManage } from "@/lib/access";
import { shareDocumentSchema } from "@/lib/documents";

const ALICE = "user_alice";
const BOB = "user_bob";
const CAROL = "user_carol";
const doc = { id: "doc_1", ownerId: ALICE };

describe("administering shares is owner-only", () => {
  it("permits the owner to manage", () => {
    expect(canManage(ALICE, doc)).toBe(true);
  });

  it("refuses a share recipient, who may still read", () => {
    const shares = [{ documentId: doc.id, userId: BOB }];
    expect(canAccess(BOB, doc, shares)).toBe(true);
    expect(canManage(BOB, doc)).toBe(false);
  });

  it("refuses a user with no access at all", () => {
    expect(canManage(CAROL, doc)).toBe(false);
  });

  it("is unaffected by how many shares exist", () => {
    const many = [
      { documentId: doc.id, userId: BOB },
      { documentId: doc.id, userId: CAROL },
    ];
    expect(canAccess(BOB, doc, many)).toBe(true);
    expect(canManage(BOB, doc)).toBe(false);
    expect(canManage(CAROL, doc)).toBe(false);
    expect(canManage(ALICE, doc)).toBe(true);
  });
});

describe("share input", () => {
  it("trims and lowercases the address for lookup", () => {
    const parsed = shareDocumentSchema.parse({ email: "  Bob@Ajaia.TEST  " });
    expect(parsed.email).toBe("bob@ajaia.test");
  });

  it("rejects an empty or malformed address", () => {
    expect(shareDocumentSchema.safeParse({ email: "" }).success).toBe(false);
    expect(shareDocumentSchema.safeParse({ email: "   " }).success).toBe(false);
    expect(shareDocumentSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
