'use client';

import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="w-full bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/tourism-logo.png"
                alt="TrioTrip logo"
                width={36}
                height={36}
                priority
              />
              <span className="text-lg font-extrabold tracking-wide text-teal-700">
                TrioTrip
              </span>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
