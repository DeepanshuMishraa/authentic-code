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
  openGraph: {
    title: "codedoc.ai",
    description: "AI powered vibe coding checker",
    images: [
      {
        url: "https://codedoc.deepanshumishra.xyz/og.png",
        width: 1200,
        height: 630,
        alt: "codedoc.ai",
      }
    ]
  },
  twitter: {
    title: "codedoc.ai",
    description: "AI powered vibe coding checker",
    images: [
      {
        url: "https://codedoc.deepanshumishra.xyz/og.png",
        width: 1200,
        height: 630,
        alt: "codedoc.ai",
      }
    ],
    creator:"@deepanshuDipxsy"
  },
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
