import type { Metadata } from "next";
import { Geist_Mono, Sarabun } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-ui",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Senior Health Check",
  description:
    "แอปตรวจสุขภาพสำหรับผู้สูงอายุ พร้อมบันทึกความดัน สแกนยา สรุปสุขภาพด้วย AI และติดตามอาการร่วมกับคุณหมอ",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${sarabun.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
