import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anamnesisai.vercel.app"),
  title: "Anamnesis — Every patient's story. Remembered.",
  description:
    "Anamnesis turns fragmented medical records into one living clinical memory — connected, reasoned over, and always current. Built on self-hosted, open-source Cognee, so patient data never leaves your walls.",
  keywords: [
    "clinical memory",
    "medical records",
    "knowledge graph",
    "Cognee",
    "healthcare AI",
    "patient history",
  ],
  openGraph: {
    title: "Anamnesis — Every patient's story. Remembered.",
    description:
      "A persistent clinical memory that remembers, recalls, improves and forgets. Built on self-hosted, open-source Cognee.",
    url: "https://anamnesisai.vercel.app",
    siteName: "Anamnesis",
    images: [{ url: "/generated/hero.png", width: 1408, height: 792 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anamnesis — Every patient's story. Remembered.",
    description:
      "A persistent clinical memory built on self-hosted, open-source Cognee.",
    images: ["/generated/hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      >
        <body className="min-h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
