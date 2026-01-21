import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "AI + manual travel planning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              {/* Logo */}
              <img
                src="/logo.png"
                alt="TrioTrip"
                className="h-10 w-10 rounded-md object-contain"
              />
              {/* Brand */}
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  TrioTrip
                </span>
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
