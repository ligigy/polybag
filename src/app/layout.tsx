import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Polymarket Grid Bot',
  description: 'Polybag 网格交易控制面板',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-50 text-zinc-900 antialiased`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="mx-auto w-full max-w-9/12 flex-1 px-4 py-6">{children}</main>
            <footer className="border-t bg-white/60 py-4">
              <div className="mx-auto flex w-full max-w-6xl justify-between px-4 text-xs text-zinc-500">
                <span>© {new Date().getFullYear()} Polybag Labs</span>
                <span>Powered by Polymarket CLOB</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
