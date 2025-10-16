"use client";
import React from "react";

type Props = {
  currency: string;
  onChangeCurrency: (c: string) => void;
};

export default function TopBar({ currency, onChangeCurrency }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__right">
        <select
          aria-label="Currency"
          className="currency-select"
          value={currency}
          onChange={(e) => onChangeCurrency(e.target.value)}
          title="Choose currency"
        >
          {["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "SGD", "AED"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <a className="pill pill--ghost" href="/saved">⭐ Saved</a>
        <a className="pill pill--primary" href="/login">🔐 Login</a>
      </div>
    </header>
  );
}
