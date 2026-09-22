import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { UID_COOKIE, resolveUserFromUid } from "@/lib/session";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  return resolveUserFromUid(store.get(UID_COOKIE)?.value, (id) =>
    prisma.user.findUnique({ where: { id } }),
  );
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
