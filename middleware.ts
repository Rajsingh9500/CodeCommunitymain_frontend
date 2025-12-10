import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes list
const protectedRoutes = ["/dashboard", "/profile", "/settings"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // If route is protected and no token → redirect to login
  if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Apply middleware only to certain paths
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*"],
};
