// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "Top-3 travel picks – smarter, clearer, bookable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
