'use client';

import Link from 'next/link';
import WalletConnectButton from '@/app/components/WalletConnectButton';

const navLinks = [{ href: '/', label: '' }];

export function Header() {
  return (
    <header className="border-b border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm transition-colors duration-200">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity"
        >
          Polymarket 网格交易平台
        </Link>
        <nav className="flex items-center gap-4">
          <div className="flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <WalletConnectButton />
        </nav>
      </div>
    </header>
  );
}
