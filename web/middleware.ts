import { NextResponse, type NextRequest } from "next/server";

const userProtectedPaths = [
  "/home",
  "/post",
  "/profile",
  "/request",
  "/messages",
  "/notifications",
  "/others-request",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;

  if (!session) {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    const isUserProtected = userProtectedPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isUserProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/post/:path*",
    "/request/:path*",
    "/profile/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/others-request/:path*",
    "/login",
    "/signup",
    "/admin/:path*",
  ],
};