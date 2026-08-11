"use client";

import Link from "next/link";
import { AlertTriangle, Tag, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import QRCodeGenerator from "./QRCodeGenerator";

export default function ShortenForm({
  user,
  authLoading,
  longUrl,
  setLongUrl,
  customAlias,
  setCustomAlias,
  topic,
  setTopic,
  shortenLoading,
  shortenError,
  shortenResult,
  handleShorten,
  copyToClipboard,
}) {
  return (
    <section className="border border-border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Shorten URL
        </h2>
        {!authLoading && !user && (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
            Shortening Anonymously •{" "}
            <Link href="/auth" className="underline font-bold">
              Sign In
            </Link>{" "}
            to save URLs
          </span>
        )}
      </div>

      <form onSubmit={handleShorten} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
            Destination URL
          </label>
          <input
            type="url"
            required
            placeholder="https://example.com/long-original-url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
              Custom Alias (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. blog-campaign"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
              Topic Group (Optional)
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
            >
              <option value="General">General</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Social">Social</option>
            </select>
          </div>
        </div>

        {shortenError && (
          <div className="p-3 bg-red-500/5 text-red-600 dark:text-red-400 text-xs font-medium rounded border border-red-500/10 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {shortenError}
          </div>
        )}

        {user ? (
          <button
            type="submit"
            disabled={shortenLoading}
            className="w-full py-2 bg-accent text-accent-foreground font-semibold rounded hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {shortenLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate Short URL"
            )}
          </button>
        ) : (
          <Link
            href="/auth"
            className="w-full block text-center py-2 bg-accent text-accent-foreground font-semibold rounded hover:opacity-90 transition-opacity text-xs uppercase tracking-wider"
          >
            Sign In to Generate Short URL
          </Link>
        )}
      </form>

      {/* Skeleton Loading Placeholder */}
      {shortenLoading && !shortenResult && (
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center gap-6 justify-between animate-pulse">
          <div className="flex-grow w-full space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-muted border border-border/50 rounded"></div>
              <div className="h-5 w-24 bg-muted border border-border/50 rounded"></div>
            </div>
            <div>
              <div className="h-3 w-28 bg-muted rounded mb-1.5"></div>
              <div className="h-9 w-full bg-muted border border-border rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-muted border border-border rounded"></div>
              <div className="h-8 w-24 bg-muted border border-border rounded"></div>
            </div>
          </div>
          <div className="w-32 h-32 bg-muted border border-border rounded flex-shrink-0"></div>
        </div>
      )}

      {/* Sub-Card: Shorten Result */}
      {shortenResult && (
        <div
          className={`mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center gap-6 justify-between transition-opacity duration-200 ${
            shortenLoading ? "opacity-40 pointer-events-none" : "animate-in fade-in slide-in-from-bottom-2"
          }`}
        >
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                Created
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {shortenResult.topic}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
                Shortened URL
              </span>
              <div className="flex items-center gap-2 bg-muted border border-border rounded p-2">
                <span className="text-sm font-mono text-foreground truncate flex-1 select-all">
                  {shortenResult.shortUrl}
                </span>
                <button
                  onClick={() => copyToClipboard(shortenResult.shortUrl)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={shortenResult.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 bg-foreground text-background hover:opacity-90 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" />
                Visit URL
              </a>
              <button
                onClick={() => {
                  const statsForm = document.getElementById("stats-lookup-form");
                  if (statsForm) {
                    const input = statsForm.querySelector("input");
                    if (input) input.value = shortenResult.shortCode;
                    statsForm.requestSubmit();
                  }
                  document.getElementById("stats-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex-1 py-2 px-3 bg-muted hover:bg-border rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                View Stats
              </button>
            </div>
          </div>

          <div className="flex-shrink-0">
            <QRCodeGenerator url={shortenResult.shortUrl} shortCode={shortenResult.shortCode} />
          </div>
        </div>
      )}
    </section>
  );
}
