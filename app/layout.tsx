import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        {/* Header */}
        <header className="w-full border-b bg-slate-50">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="TrioTrip"
                width={52}              // ⬅️ bigger logo
                height={52}
                priority
              />
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{ color: "#0f766e" }} // ⬅️ bolder + color
              >
                TrioTrip
              </span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
