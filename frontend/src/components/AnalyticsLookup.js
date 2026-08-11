"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AnalyticsLookup({
  lookupCode,
  setLookupCode,
  statsLoading,
  statsError,
  statsResult,
  handleLookup,
}) {
  return (
    <section id="stats-section" className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">
        Link Analytics
      </h2>

      <form id="stats-lookup-form" onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="Enter short code or short URL"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={statsLoading}
          className="py-2 px-4 bg-accent text-accent-foreground font-semibold rounded text-xs uppercase tracking-wider transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-40 flex-shrink-0"
        >
          {statsLoading ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading...
            </>
          ) : (
            "Get Analytics"
          )}
        </button>
      </form>

      {statsError && (
        <div className="mt-4 p-3 bg-red-500/5 text-red-600 dark:text-red-400 text-xs font-medium rounded border border-red-500/10 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {statsError}
        </div>
      )}

      {/* Skeleton Loading Placeholder */}
      {statsLoading && !statsResult && (
        <div className="mt-6 border border-border rounded-lg p-5 bg-muted/40 space-y-4 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded bg-muted/50 border-border/30 h-[80px]"></div>
            <div className="p-4 border border-border rounded bg-muted/50 border-border/30 h-[80px]"></div>
            <div className="p-4 border border-border rounded bg-muted/50 border-border/30 col-span-2 h-[80px]"></div>
          </div>
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="h-4 w-full bg-muted/60 border border-border/20 rounded"></div>
            <div className="h-4 w-3/4 bg-muted/60 border border-border/20 rounded"></div>
          </div>
        </div>
      )}

      {/* Stats Result View */}
      {statsResult && (
        <div
          className={`mt-6 border border-border rounded-lg p-5 bg-muted/40 space-y-4 transition-opacity duration-200 ${
            statsLoading ? "opacity-40 pointer-events-none" : "animate-in fade-in slide-in-from-bottom-2"
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded bg-card">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide block">Clicks</span>
              <span className="text-2xl font-bold tracking-tight text-foreground block mt-1">{statsResult.clicks}</span>
            </div>

            <div className="p-4 border border-border rounded bg-card">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide block">Topic</span>
              <span className="text-sm font-semibold text-foreground block mt-2.5 truncate">{statsResult.topic}</span>
            </div>

            <div className="p-4 border border-border rounded bg-card col-span-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide block">Short Code</span>
              <span className="text-sm font-mono text-foreground block mt-2.5 truncate">/{statsResult.shortCode}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-border">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Original Destination:</span>
              <span className="text-foreground font-mono truncate max-w-[280px] sm:max-w-[450px]" title={statsResult.longUrl}>
                {statsResult.longUrl}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Created Date:</span>
              <span className="text-foreground">
                {new Date(statsResult.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
