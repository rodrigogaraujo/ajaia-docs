import { z } from "zod";

export const UID_COOKIE = "uid";

const UID_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const uidSchema = z.string().trim().min(1).max(64);

export function parseUid(raw: string | undefined | null): string | null {
  const parsed = uidSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function resolveUserFromUid<T>(
  raw: string | undefined | null,
  lookup: (id: string) => Promise<T | null>,
): Promise<T | null> {
  const uid = parseUid(raw);
  if (!uid) return null;
  return lookup(uid);
}

export function uidCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isProduction,
    maxAge: UID_MAX_AGE_SECONDS,
  };
}
