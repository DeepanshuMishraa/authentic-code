import type { Metadata } from "next";
import localFont from 'next/font/local'
import "./globals.css";
import QueryProvider from "./provider";
import Appbar from "@/components/Appbar";
import { Toaster } from "@/components/ui/sonner";

const satoshi = localFont({
  src: "./Satoshi-Variable.ttf",
})

export const metadata: Metadata = {
  title: "codedoc.ai",
  description: "AI powered vibe coding checker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <QueryProvider>
        <body
          className={`${satoshi.className} antialiased`}
        >
          <Appbar />

          {children}
          <Toaster />
        </body>
      </QueryProvider>
    </html>
  );
}
