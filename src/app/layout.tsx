import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Geschenke-Manager",
  description: "Geschenke für Freunde und Familie verwalten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} font-sans antialiased bg-background`}>
        <Navbar />
        <main className="ml-64 min-h-screen">
          <div className="p-8">{children}</div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
