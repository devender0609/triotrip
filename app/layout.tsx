import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "Plan trips with AI or manual search.",
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
              {/* Logo size fixed */}
              <img
                src="/logo.png"
                alt="TrioTrip"
                className="h-10 w-auto object-contain"
              />
              <div className="leading-tight">
                <div className="text-base font-semibold">TrioTrip</div>
              </div>
            </Link>

            {/* Removed: NextMove / Decision Assistant + App/Pricing/Login/Dark */}
            <div />
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
