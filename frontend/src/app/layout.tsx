import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "../contexts/WalletContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { CartProvider } from "../contexts/CartContext";
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
        <ThemeProvider>
          <WalletProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
