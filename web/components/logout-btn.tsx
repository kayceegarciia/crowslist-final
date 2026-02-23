"use client";

import type { FormEvent } from "react";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutAction } from "@/app/actions/auth";

export function Logout({ type }: { type: "ADMIN" | "USER" }) {
  const router = useRouter();

  async function handleLogout(e: FormEvent) {
    e.preventDefault();

    const response = await logoutAction();
    toast.success(response.success);
    router.replace("/");
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
