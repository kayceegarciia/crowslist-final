"use client";

import type { FormEvent } from "react";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export function Logout({ type }: { type: "ADMIN" | "USER" }) {
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

  async function handleLogout(e: FormEvent) {
    e.preventDefault();

    try {
      const response = await axios.post(
        type === "ADMIN"
          ? `${BASE_URL}/admin/logout`
          : `${BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const data = response.data.msg;

        // Clear localStorage
        localStorage.removeItem("session");
        localStorage.removeItem("uid");

        toast.success(data);
        router.replace("/");
        return;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data.msg;
        toast.error(errorData);
        return;
      }
    }
  }

  return (
    <Button
      onClick={handleLogout}
      className="w-full bg-primary text-white hover:bg-accent"
    >
      <LogOut className="mr-2" /> Logout
    </Button>
  );
}
