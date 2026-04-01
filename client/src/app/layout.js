// src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { WebSocketProvider } from '@/contexts/WebSocketContext.jsx';
import { Providers } from './providers';
import BackToHomeButton from '@/components/layout/BackToHomeButton.jsx';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <AuthProvider>
            <WebSocketProvider>
              <div className="flex-1">
                <BackToHomeButton />
                {children}
              </div>
            </WebSocketProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
