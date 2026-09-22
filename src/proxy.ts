import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UID_COOKIE } from "@/lib/session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(UID_COOKIE)) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = "";
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
