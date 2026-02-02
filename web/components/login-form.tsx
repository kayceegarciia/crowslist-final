"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { LoginSchema } from "@/types/zodSchema";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export function LoginForm({ type }: { type: "user" | "admin" }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleUserLogin(values: z.infer<typeof LoginSchema>) {
    try {
      console.log("[DEBUG] Sending login request to:", `${BASE_URL}/auth/login`);
      const response = await axios.post(`${BASE_URL}/auth/login`, values, {
        withCredentials: true,
      });

      console.log("[DEBUG] Login response status:", response.status);
      console.log("[DEBUG] Login response data:", response.data);

      if (response.status === 200) {
        const { msg, token, uid } = response.data;
        console.log("[DEBUG] Success message:", msg);
        
        // Store token and uid in localStorage for cross-origin auth
        localStorage.setItem("session", token);
        localStorage.setItem("uid", uid);
        console.log("[DEBUG] Token stored in localStorage");
        
        toast.success(msg);
        console.log("[DEBUG] Attempting redirect to /home");
        await router.replace("/home");
        console.log("[DEBUG] Redirect completed");
        return;
      }
    } catch (error) {
      console.error("[DEBUG] Login error:", error);

      if (error instanceof AxiosError) {
        const errorData = error.response?.data.msg;
        console.error("[DEBUG] Axios error data:", errorData);
        return toast.error(errorData);
      }
    }
  }

  async function handleAdminLogin(values: z.infer<typeof LoginSchema>) {
    try {
      console.log("[DEBUG] Sending admin login request to:", `${BASE_URL}/admin/login`);
      const response = await axios.post(`${BASE_URL}/admin/login`, values, {
        withCredentials: true,
      });

      console.log("[DEBUG] Admin login response status:", response.status);
      console.log("[DEBUG] Admin login response data:", response.data);

      if (response.status === 200) {
        const { msg, token, uid } = response.data;
        console.log("[DEBUG] Success message:", msg);
        
        // Store token and uid in localStorage for cross-origin auth
        localStorage.setItem("session", token);
        localStorage.setItem("uid", uid);
        console.log("[DEBUG] Token stored in localStorage");
        
        toast.success(msg);
        console.log("[DEBUG] Attempting redirect to /admin/dashboard");
        await router.replace("/admin/dashboard");
        console.log("[DEBUG] Redirect completed");
        return;
      }
    } catch (error) {
      console.error("[DEBUG] Admin login error:", error);

      if (error instanceof AxiosError) {
        const errorData = error.response?.data.msg;
        console.error("[DEBUG] Axios error data:", errorData);
        toast.error(errorData);
        return;
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(
        type === "user" ? handleUserLogin : handleAdminLogin
      )}
      className="space-y-5"
    >
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold text-primary">
          {type === "admin" ? "Admin Login" : "User Login"}
        </h1>
        <p className="text-accent text-balance text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      <div className="grid gap-2">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-md">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder={type === "admin" ? "your email" : "your edu email"}
            required
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-base">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="text-md">
              Password
            </Label>
            {/* <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a> */}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="your password"
            {...form.register("password")}
            required
          />
          {form.formState.errors.password && (
            <p className="text-red-500 text-base">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full flex items-center gap-2 mt-5 bg-primary hover:bg-accent"
        >
          {form.formState.isSubmitting ? "Submitting..." : "Login"}
        </Button>
      </div>

      {type === "user" && (
        <div className="text-center text-sm mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-bold text-primary hover:text-info transition-all duration-300 underline underline-offset-4"
          >
            Sign up
          </Link>
        </div>
      )}
    </form>
  );
}
