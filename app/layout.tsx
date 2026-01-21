import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "AI + Manual trip planning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100" style={{ backgroundImage: "none", filter: "none" }}>
        {/* Top nav */}
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="TrioTrip"
                width={32}
                height={32}
                priority
                className="h-8 w-8 rounded-md object-contain"
              />
              <span className="text-lg font-semibold tracking-tight">TrioTrip</span>
            </Link>

            {/* Right side intentionally minimal; page components handle auth/currency UI */}
            <div className="flex items-center gap-2" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
