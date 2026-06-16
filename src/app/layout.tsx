import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Super Ren Group — Property CRM",
    template: "%s · Super Ren Group",
  },
  description:
    "Manage listings. Share faster. Close smarter. Private real estate CRM, digital business card & shareable property catalog.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" className={inter.variable}>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
