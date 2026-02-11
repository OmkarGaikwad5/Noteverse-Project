import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath =
    path === "/login" || path === "/signup" || path === "/";

  const isApiPath = path.startsWith("/api/");

  // OLD JWT token
  const jwtToken = request.cookies.get("token")?.value;

  // NextAuth token
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!jwtToken || !!nextAuthToken;

  // 1. Block protected routes if not logged in
  if (!isPublicPath && !isApiPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. If already logged in, prevent visiting login/signup
  if ((path === "/login" || path === "/signup") && isLoggedIn) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/home",
    "/library",
    "/profile",
    "/notebook/:path*",
    "/note/:path*",
  ],
};
