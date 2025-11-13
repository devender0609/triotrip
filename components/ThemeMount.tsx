"use client";
import { useEffect } from "react";

type Theme = "theme-ocean" | "theme-sunset" | "theme-forest";

export default function ThemeMount({ theme = "theme-ocean" }: { theme?: Theme }) {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add(theme);
    return () => el.classList.remove(theme);
  }, [theme]);
  return null;
}
