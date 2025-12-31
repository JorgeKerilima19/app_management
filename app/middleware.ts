// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next();
  }

  const user = await getCurrentUser();
  if (!user) {
    const url = new URL("/login", request.url);
    if (path !== "/") url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
