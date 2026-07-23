"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  if (isDark === null) return null;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 text-sm transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      aria-label="Cambiar tema"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Claro" : "Oscuro"}
    </button>
  );
}
