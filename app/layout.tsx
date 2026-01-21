import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
    <html lang="en">
      <body className="min-h-screen bg-[#f6f9fc] text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              {/* Logo hard-locked to 40x40 so it cannot scale huge */}
              <span className="relative block h-10 w-10 overflow-hidden rounded-md">
                <Image
                  src="/logo.png"
                  alt="TrioTrip"
                  fill
                  sizes="40px"
                  priority
                  className="object-contain"
                />
              </span>

              <div className="leading-tight">
                <div className="text-base font-semibold">TrioTrip</div>
              </div>
            </Link>

            {/* Removed: NextMove / Decision Assistant / AppPricing / Login / Dark */}
            <div />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
