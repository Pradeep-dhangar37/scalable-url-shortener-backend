import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Shorten.it | Scalable URL Shortener & Analytics",
  description: "Generate collision-free shortened links with custom aliases, real-time analytics, dynamic QR codes, and performance metrics.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        {/* Google Identity Services SDK */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
