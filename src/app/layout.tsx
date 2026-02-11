
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SyncProvider } from "@/context/SyncContext";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoteVerse",
  description: "Organize, create, and manage your notes effortlessly with NoteVerse — your intelligent note-taking companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SyncProvider>
            <Navbar />
            <div className="pt-20">{children}</div>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
