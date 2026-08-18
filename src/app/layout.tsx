import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import { Providers } from '@/lib/ui/providers';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | OpenPKA",
    default: "OpenPKA - Hệ thống Quản trị Đại học Mở",
  },
  description: "Hệ thống Quản trị Đại học Mở - OpenPKA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${firaCode.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
