import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "I.G.A.V",
  description: "Inventario y gestion de alquileres y ventas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
