"use client";

import axios from "axios";
import { useEffect } from "react";

/**
 * Client-side component that sets up axios interceptor to attach
 * the session token from localStorage to all API requests.
 * This enables auth for cross-origin requests.
 */
export function AxiosInterceptorProvider() {
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      // Get token from localStorage (set during login)
      const token = localStorage.getItem("session");
      
      if (token) {
        // Add token as both a header and a custom header for middleware
        config.headers["Authorization"] = `Bearer ${token}`;
        config.headers["x-session-token"] = token;
      }
      
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  return null;
}
