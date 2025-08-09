// frontend/src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// --- 1. Import Providers ---
// We now only need AuthProvider, which handles both wallet and user session.
import { AuthProvider } from "../contexts/AuthContext"; 
import { ThemeProvider } from "../contexts/ThemeContext";
import { CartProvider } from "../contexts/CartContext";
// import { NotificationProvider } from "../contexts/NotificationContext"; // Keep this for when we build it
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
  title: "BCD Marketplace - Decentralized Commerce Platform",
  description: "A modern blockchain-powered marketplace for secure and transparent commerce",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors`}
      >
        {/* --- 2. Nest Providers Logically --- */}
        {/* ThemeProvider is outermost for global styling. */}
        {/* AuthProvider is next, as Cart and Notifications depend on the user. */}
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {/* <NotificationProvider> */}
                {children}
              {/* </NotificationProvider> */}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}