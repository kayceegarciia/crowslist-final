import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check both cookies and the localStorage-stored token (stored in a custom header by the client)
  const sessionCookie = request.cookies.get("session")?.value;
  const sessionHeader = request.headers.get("x-session-token");
  const hasSession = sessionCookie || sessionHeader;

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

  if (!hasSession && restrictedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && publicPaths.includes(pathname)) {
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