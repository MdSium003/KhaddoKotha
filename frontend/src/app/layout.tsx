import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Chatbot } from "@/components/chatbot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KhaddoKotha",
  description: "AI-powered health monitoring platform",
  icons: {
    icon: [
      { url: "/Tab.png" },
      { url: "/Tab.png", sizes: "32x32", type: "image/png" },
      { url: "/Tab.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/Tab.png",
    shortcut: "/Tab.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {googleClientId && (
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="lazyOnload"
          />
        )}
        <AuthProvider>
          {children}
          <Chatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
