// app/middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: any) {
  const token = request.cookies.get("auth_token")?.value; // ← correct!
  const path = request.nextUrl.pathname;

  const isAuthPage = path.startsWith("/login");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|.*\\.(?:jpg|jpeg|png|gif|svg|ico)$).*)"],
};
