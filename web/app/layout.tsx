import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";
import { AxiosInterceptorProvider } from "@/components/providers/axios-interceptor";
import { AuthGuard } from "@/components/providers/auth-guard";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Crowslist",
    template: "%s | Crowslist",
  },
  description:
    "An online marketplace for college students to buy and sell college-related materials. Connect with fellow students, save money, and contribute to a greener campus environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`antialiased ${roboto.className}`}>
      <body className="">
        <AxiosInterceptorProvider />
        <AuthGuard />
        {children}
        <Toaster visibleToasts={10} richColors position="top-right" />
      </body>
    </html>
  );
}
