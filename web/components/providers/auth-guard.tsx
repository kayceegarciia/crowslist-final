"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Client-side auth guard - ensures user is redirected if they don't have a token
 * and are trying to access protected routes.
 */
export function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const restrictedPaths = [
      "/home",
      "/post",
      "/profile",
      "/request",
      "/messages",
      "/notifications",
    ];

    const isRestrictedPath = restrictedPaths.some((path) =>
      pathname.startsWith(path)
    );
    const hasToken = localStorage.getItem("session");

    if (isRestrictedPath && !hasToken) {
      console.log("[AuthGuard] No token found, redirecting to login");
      router.replace("/login");
    }
  }, [pathname, router]);

  return null;
}
