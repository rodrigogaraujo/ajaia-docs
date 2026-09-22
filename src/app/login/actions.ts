"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { UID_COOKIE, uidCookieOptions } from "@/lib/session";

const signInSchema = z.object({ userId: z.string().trim().min(1).max(64) });

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) redirect("/login?error=invalid");

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!user) redirect("/login?error=unknown");

  const store = await cookies();
  store.set(
    UID_COOKIE,
    user.id,
    uidCookieOptions(process.env.NODE_ENV === "production"),
  );
  redirect("/");
}

export async function signOut() {
  const store = await cookies();
  store.delete(UID_COOKIE);
  redirect("/login");
}
