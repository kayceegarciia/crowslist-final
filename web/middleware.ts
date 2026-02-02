import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Middleware on server-side can't access localStorage.
  // Client-side AuthGuard component will handle route protection.
  // Just pass through and let client-side auth guard protect routes.
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