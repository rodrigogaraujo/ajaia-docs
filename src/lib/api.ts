import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const notFound = () => apiError("Document not found", 404);
export const forbidden = () => apiError("You cannot perform this action", 403);
export const unauthorized = () => apiError("Not signed in", 401);
export const badRequest = (message: string) => apiError(message, 400);

type Authenticated = { user: User; response?: never };
type Unauthenticated = { user?: never; response: NextResponse };

export async function requireApiUser(): Promise<Authenticated | Unauthenticated> {
  const user = await getCurrentUser();
  if (!user) return { response: unauthorized() };
  return { user };
}
