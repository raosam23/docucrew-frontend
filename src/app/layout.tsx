import "./globals.css";

import type { Metadata } from "next";
import { Spectral } from "next/font/google";

import Providers from "@/components/providers";

const spectral = Spectral({ 
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DocuCrew",
  description: "DocuCrew is an AI-powered document query tool powered by RAG and CrewAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
