import { describe, expect, it, vi } from "vitest";
import { parseUid, resolveUserFromUid, uidCookieOptions } from "@/lib/session";

const alice = { id: "user_alice", name: "Alice" };

const lookupKnownUser = async (id: string) =>
  id === alice.id ? alice : null;

describe("parseUid", () => {
  it("accepts a non-empty identifier and trims it", () => {
    expect(parseUid("  user_alice  ")).toBe("user_alice");
  });

  it("rejects absent, empty, and oversized values", () => {
    expect(parseUid(undefined)).toBeNull();
    expect(parseUid(null)).toBeNull();
    expect(parseUid("")).toBeNull();
    expect(parseUid("   ")).toBeNull();
    expect(parseUid("x".repeat(65))).toBeNull();
  });
});

describe("resolveUserFromUid", () => {
  it("returns the user when the cookie matches one", async () => {
    await expect(resolveUserFromUid(alice.id, lookupKnownUser)).resolves.toEqual(
      alice,
    );
  });

  it("returns null when the cookie is absent, without consulting the lookup", async () => {
    const lookup = vi.fn(lookupKnownUser);
    await expect(resolveUserFromUid(undefined, lookup)).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("returns null when the cookie refers to a user that no longer exists", async () => {
    await expect(
      resolveUserFromUid("user_deleted", lookupKnownUser),
    ).resolves.toBeNull();
  });
});

describe("uidCookieOptions", () => {
  it("always withholds the cookie from client scripts", () => {
    expect(uidCookieOptions(false).httpOnly).toBe(true);
    expect(uidCookieOptions(true).httpOnly).toBe(true);
  });

  it("marks the cookie secure only in production", () => {
    expect(uidCookieOptions(true).secure).toBe(true);
    expect(uidCookieOptions(false).secure).toBe(false);
  });
});
