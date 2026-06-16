import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Mundo Servimil 2.0",
  description: "Panel administrativo PRESTAMIL / SERVIMIL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-canvas text-slate-900">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
