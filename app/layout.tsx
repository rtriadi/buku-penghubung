import type { Metadata, Viewport } from "next";
import { Nunito, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buku Penghubung Online | PAUD IT Darul Khairat",
  description: "Platform komunikasi digital antara guru dan orang tua siswa PAUD Islam Terpadu Darul Khairat. Pantau aktivitas harian anak Anda dengan mudah.",
  keywords: "buku penghubung, PAUD, Darul Khairat, komunikasi guru orang tua, laporan harian anak",
  authors: [{ name: "PAUD IT Darul Khairat" }],
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#27AE60",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${nunito.variable} ${poppins.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
