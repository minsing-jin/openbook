import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "../components/app-shell";
import { OpenBookProvider } from "../components/openbook-provider";

export const metadata: Metadata = {
  title: "OpenBook",
  description: "A tablet-first web reader for imported books, PDFs, and authenticated web captures."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <OpenBookProvider>
          <AppShell>{children}</AppShell>
        </OpenBookProvider>
      </body>
    </html>
  );
}
