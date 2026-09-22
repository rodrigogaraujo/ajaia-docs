import { describe, expect, it } from "vitest";
import { canAccess, canManage } from "@/lib/access";

const ALICE = "user_alice";
const BOB = "user_bob";
const CAROL = "user_carol";

const doc = { id: "doc_1", ownerId: ALICE };
const otherDoc = { id: "doc_2", ownerId: ALICE };

const sharedWithBob = [{ documentId: doc.id, userId: BOB }];

describe("canAccess", () => {
  it("grants the owner access to their own document", () => {
    expect(canAccess(ALICE, doc, [])).toBe(true);
  });

  it("grants a share recipient access", () => {
    expect(canAccess(BOB, doc, sharedWithBob)).toBe(true);
  });

  it("refuses an unrelated user", () => {
    expect(canAccess(CAROL, doc, sharedWithBob)).toBe(false);
  });

  it("refuses a share belonging to a different document", () => {
    const shareOfOtherDoc = [{ documentId: otherDoc.id, userId: BOB }];
    expect(canAccess(BOB, doc, shareOfOtherDoc)).toBe(false);
  });
});

describe("canManage", () => {
  it("permits the owner", () => {
    expect(canManage(ALICE, doc)).toBe(true);
  });

  it("refuses a share recipient", () => {
    expect(canManage(BOB, doc)).toBe(false);
  });

  it("is unaffected by shares", () => {
    expect(canManage(BOB, doc)).toBe(canManage(BOB, doc));
    expect(canAccess(BOB, doc, sharedWithBob)).toBe(true);
    expect(canManage(BOB, doc)).toBe(false);
  });
});
