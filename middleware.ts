import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // Public routes (accessible without login)
  const publicRoutes = ["/login", "/register"];

  const isPublic = publicRoutes.some((route) => path.startsWith(route));

  // If user is NOT logged in → block ALL routes except login/register
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user IS logged in → prevent access to login/register
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect ALL pages except API, static files, next internal files
  matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};
