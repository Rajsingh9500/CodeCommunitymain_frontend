import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import ToastProvider from "./providers/ToastProvider";
import Header from "../components/Header";
import MobileFooter from "@/components/MobileFooter";

import { ChatProvider } from "@/app/providers/ChatProvider";
import { AuthProvider } from "@/app/providers/AuthProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Code Community",
  description: "A collaborative platform for developers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* AUTH PROVIDER MUST WRAP EVERYTHING */}
        <AuthProvider>
          <ChatProvider>
            <ToastProvider />
            <Header />
            <main className="min-h-screen">{children}</main>
          </ChatProvider>
        </AuthProvider>

      </body>
    </html>
  );
}
