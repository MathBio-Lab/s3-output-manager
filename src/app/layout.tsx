import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Genomas Manager - S3 File Management System",
  description: "Secure file management system for S3 outputs and file execution services. Access, preview, and manage your genomic data files efficiently.",
  keywords: ["S3 manager", "file management", "genomic data", "cloud storage", "file explorer"],
  authors: [{ name: "Genomas" }],
  creator: "Genomas",
  publisher: "Genomas",
  icons: {
    icon: "/lemon.svg",
  },
  openGraph: {
    title: "Genomas Manager - S3 File Management System",
    description: "Secure file management system for S3 outputs and file execution services.",
    type: "website",
    locale: "en_US",
    siteName: "Genomas Manager",
  },
  twitter: {
    card: "summary",
    title: "Genomas Manager",
    description: "Secure file management system for S3 outputs and file execution services.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { ThemeProvider } from "@/components/theme-provider";
import MobileBlocker from "@/components/mobile-blocker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MobileBlocker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
