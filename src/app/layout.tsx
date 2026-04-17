import type { Metadata } from "next";
import { Geist_Mono, Sarabun } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
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
  metadataBase: new URL("https://seniorhealthcheck.xyz"),
  title: "Senior Health Check",
  description:
    "แพลตฟอร์มดูแลสุขภาพผู้สูงอายุ ใช้งานง่ายทั้งคอมและมือถือ สแกนยา บันทึกความดัน และติดตามข้อมูลร่วมกับคุณหมอ",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Senior Health Check",
    description:
      "ดูแลสุขภาพผู้สูงอายุจากหน้าเดียว: สแกนยา บันทึกความดัน และคุยกับคุณหมอได้ทันที",
    url: "https://seniorhealthcheck.xyz",
    siteName: "Senior Health Check",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/preview-web.png",
        width: 1200,
        height: 630,
        alt: "Senior Health Check Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Senior Health Check",
    description:
      "สแกนยา บันทึกความดัน และติดตามอาการผู้สูงอายุแบบใช้งานง่าย",
    images: ["/preview-web.png"],
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
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
