import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Read token from secure cookie OR fallback to socketToken
  const token =
    req.cookies.get("token")?.value ||
    req.cookies.get("socketToken")?.value;

  const path = req.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/login", "/register"];
  const isPublic = publicRoutes.some((route) => path.startsWith(route));

  // Block all protected routes
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent logged-in users from visiting login/register
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};
