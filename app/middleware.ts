import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(req: any) {
  const c = await cookies();
  const token = c.get("auth_token");

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
