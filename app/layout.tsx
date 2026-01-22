import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "AI + Manual trip planning.",
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
              {/* Use a simple <img> with fallback to avoid broken header if an asset name changes. */}
              <img
                src="/tourism.png"
                alt="TrioTrip"
                className="h-10 w-10 rounded-md object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src.endsWith("/tourism.png")) img.src = "/logo.png";
                }}
              />
              <div className="leading-tight">
                <div className="text-base font-extrabold tracking-tight">
                  <span className="text-slate-900 dark:text-slate-100">Trio</span>
                  <span className="text-blue-600 dark:text-blue-400">Trip</span>
                </div>
              </div>
            </Link>

            {/* intentionally empty right side (no extra nav items) */}
            <div />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
