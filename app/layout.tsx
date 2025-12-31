import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CategoriesProvider } from "@/components/categories-provider";
import { Toaster } from "@/components/ui/toaster";

import { SiteHeader } from "@/components/site-header";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RecpIQ",
  description: "AI Powered Receipt Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <CategoriesProvider>
            <SiteHeader />
            <div className="flex">
              <Sidebar />
              <div className="flex-1 md:ml-64">
                {children}
              </div>
            </div>
            <Toaster />

          </CategoriesProvider>
        </Providers>
      </body>
    </html>
  );
}
