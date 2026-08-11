"use client";

import Link from "next/link";
import { User, LogOut, LogIn, Sun, Moon } from "lucide-react";

export default function Header({ user, authLoading, onSignOutClick, theme, toggleTheme }) {
  return (
    <header className="sticky top-0 bg-background/85 backdrop-blur-md z-40 py-4 -mt-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border gap-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-mono font-bold text-lg tracking-tight text-foreground hover:opacity-85 transition-opacity">
          SHORTEN.IT
        </Link>
        <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border uppercase tracking-wide">
          Console
        </span>
      </div>

      <div className="flex items-center gap-4">
        {authLoading ? (
          <div className="h-7 w-24 bg-muted rounded animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium max-w-[120px] truncate" title={user.email}>
                {user.name}
              </span>
            </div>
            <button
              onClick={onSignOutClick}
              className="flex items-center gap-1 py-1 px-2 text-xs font-semibold rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="flex items-center gap-1 py-1 px-3 text-xs font-semibold rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        )}

        <div className="h-4 w-px bg-border hidden sm:block"></div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href="https://github.com/Pradeep-dhangar37/scalable-url-shortener"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 py-1.5 px-3 rounded border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
