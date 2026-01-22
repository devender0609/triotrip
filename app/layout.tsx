import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "trioTrip",
  description: "Search flights and hotels with manual + AI options.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="tt-header">
          <div className="tt-header-inner">
            <div className="tt-brand" aria-label="trioTrip">
              <span className="tt-brand-dot" aria-hidden="true" />
              <span className="tt-brand-text">trioTrip</span>
            </div>
          </div>
        </header>
        <main className="tt-main">{children}</main>
      </body>
    </html>
  );
}
