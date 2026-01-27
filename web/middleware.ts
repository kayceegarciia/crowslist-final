import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ✅ Use request.cookies instead of next/headers
  const sessionCookie = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const restrictedPaths = [
    "/home",
    "/post",
    "/profile/your-posts",
    "/profile",
    "/request",
    "/others-request",
  ];
  const publicPaths = ["/login", "/signup", "/"];

  if (
    !sessionCookie &&
    restrictedPaths.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/post",
    "/request",
    "/profile",
    "/profile/your-posts/:path*",
    "/others-request",
    "/login",
    "/signup",
    "/",
  ],
};