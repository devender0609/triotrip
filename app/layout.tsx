import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NextMove · Decision Assistant",
  description: "Decide your next move — fast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* Top nav */}
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/50">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NextMove"
                className="h-8 w-8 rounded-md"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold">NextMove</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Decision Assistant
                </div>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link href="/app/decide" className="btn-ghost">
                App
              </Link>
              <Link href="/pricing" className="btn-ghost">
                Pricing
              </Link>
              <Link href="/app/login" className="btn-ghost">
                Login
              </Link>
              <button className="btn-ghost" type="button">
                Dark
              </button>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        {/* Footer REMOVED */}
      </body>
    </html>
  );
}
