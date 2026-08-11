"use client";

import { RefreshCw, Copy, QrCode } from "lucide-react";

export default function TabsPanel({
  user,
  activeTab,
  setActiveTab,
  userUrls,
  userUrlsLoading,
  userUrlsError,
  fetchUserUrls,
  popularUrls,
  leaderboardLoading,
  leaderboardError,
  fetchLeaderboard,
  copyToClipboard,
  loadStatsForCode,
  setActiveQrLink,
  API_BASE,
}) {
  return (
    <section className="border border-border rounded-lg p-6 bg-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-border w-full">
          {user && (
            <button
              onClick={() => setActiveTab("my-links")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                activeTab === "my-links"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              My Links
            </button>
          )}
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "leaderboard"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={activeTab === "my-links" ? fetchUserUrls : fetchLeaderboard}
          disabled={activeTab === "my-links" ? userUrlsLoading : leaderboardLoading}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 ml-2 self-start mt-0.5"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              (activeTab === "my-links" ? userUrlsLoading : leaderboardLoading) ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* My Links Content */}
      {activeTab === "my-links" && (
        <>
          {userUrlsError && (
            <div className="p-3 bg-muted rounded border border-border text-xs text-muted-foreground mb-4">
              {userUrlsError}
            </div>
          )}

          {userUrlsLoading && userUrls.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12 gap-1">
              <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : userUrls.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12 text-center text-muted-foreground">
              <span className="text-xs font-semibold">No shortened links yet</span>
              <p className="text-[10px] text-muted-foreground max-w-[180px] mt-1">
                Shorten your first URL to see it here in your history.
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[500px] pr-1">
              {userUrls.map((url) => {
                return (
                  <div
                    key={url.shortCode}
                    className="group p-3 border border-border hover:bg-muted/50 rounded flex flex-col gap-2 transition-colors relative"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => loadStatsForCode(url.shortCode)}
                          className="font-mono font-bold text-foreground hover:underline text-xs text-left truncate block cursor-pointer"
                        >
                          /{url.shortCode}
                        </button>
                        <span className="text-[9px] text-muted-foreground font-mono block truncate mt-0.5 max-w-[180px] sm:max-w-[240px]">
                          {url.longUrl}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                          {url.clicks} <span className="text-[9px] font-normal text-muted-foreground">clicks</span>
                        </span>
                        <button
                          onClick={() =>
                            setActiveQrLink({ url: `${API_BASE}/${url.shortCode}`, shortCode: url.shortCode })
                          }
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                          title="View QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(`${API_BASE}/${url.shortCode}`, `Short link`)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono mt-1 border-t border-border/40 pt-1.5">
                      <span className="bg-muted/60 px-1 py-0.2 rounded border border-border/30 text-[8px] uppercase tracking-wide">
                        {url.topic}
                      </span>
                      <span>
                        {new Date(url.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Leaderboard Content */}
      {activeTab === "leaderboard" && (
        <>
          {leaderboardError && (
            <div className="p-3 bg-muted rounded border border-border text-xs text-muted-foreground mb-4">
              {leaderboardError}
            </div>
          )}

          {leaderboardLoading && popularUrls.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12 gap-1">
              <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : popularUrls.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12 text-center text-muted-foreground">
              <span className="text-xs font-semibold">No click stats yet</span>
              <p className="text-[10px] text-muted-foreground max-w-[150px] mt-1">
                Visit shortened URLs to see clicks reflect here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex-grow overflow-y-auto max-h-[500px]">
              {popularUrls.map((url, index) => {
                return (
                  <div
                    key={url.shortCode}
                    className="group p-2.5 border border-border hover:bg-muted rounded flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground font-bold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <button
                          onClick={() => loadStatsForCode(url.shortCode)}
                          className="font-mono font-semibold text-foreground hover:underline text-xs text-left truncate block cursor-pointer"
                        >
                          /{url.shortCode}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {url.clicks} <span className="text-[10px] font-normal text-muted-foreground">clicks</span>
                      </span>

                      <button
                        onClick={() => copyToClipboard(`${API_BASE}/${url.shortCode}`, `Short link`)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                        title="Copy Link"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
