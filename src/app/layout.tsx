import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toast";
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
  title: "ZERO6 — Find Your People. Find Your Pace. India's Running Community.",
  description:
    "ZERO6 is India's running community platform. Find local crews, join group runs, discover routes, and track your progress — all built for Indian runners.",
  keywords: ["running", "india running", "running community", "fitness", "clubs", "events", "challenges", "indian runners", "group runs", "running routes india"],
  authors: [{ name: "ZERO6" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "ZERO6 — Find Your People. Find Your Pace.",
    description: "India's running community platform. Find local crews, join group runs, discover routes, and track your progress.",
    type: "website",
    siteName: "ZERO6",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "ZERO6 — India's Running Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZERO6 — Find Your People. Find Your Pace.",
    description: "India's running community platform. Find local crews, join group runs, discover routes, and track your progress.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
