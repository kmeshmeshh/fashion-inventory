import type { Metadata } from "next";
import { QueryProvider } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion Inventory",
  description: "Manage your fashion business inventory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
