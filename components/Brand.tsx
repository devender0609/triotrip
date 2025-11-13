"use client";

import Image from "next/image";
import Link from "next/link";

export default function Brand() {
  return (
    <Link
      href="/"
      aria-label="TrioTrip home"
      className="tt-brand"
      onClick={(e) => {
        // Hard refresh to reset all state/results
        e.preventDefault();
        window.location.assign("/");
      }}
    >
      <Image src="/logo.png" alt="TrioTrip logo" width={52} height={52} priority />
      <span className="tt-brand-text">TrioTrip</span>

      <style jsx>{`
        .tt-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          user-select: none;
          color: #0f172a;
        }
        .tt-brand-text {
          font-weight: 900;
          font-size: 26px;
          letter-spacing: 0.2px;
          color: #0f172a;
          line-height: 1.1;
        }

        /* Ensure no underline, even if globals force it */
        .tt-brand,
        .tt-brand:hover,
        .tt-brand:focus,
        .tt-brand:active,
        .tt-brand * {
          text-decoration: none !important;
          border-bottom: 0 !important;
        }
      `}</style>
    </Link>
  );
}