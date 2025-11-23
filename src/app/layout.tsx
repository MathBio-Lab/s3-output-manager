import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Genomas Manager",
  description: "Manager for S3 outputs and file execution services",
  icons: {
    icon: "/lemon.svg",
  },
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
