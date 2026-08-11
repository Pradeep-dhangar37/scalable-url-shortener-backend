"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import Header from "../components/Header";
import ShortenForm from "../components/ShortenForm";
import AnalyticsLookup from "../components/AnalyticsLookup";
import TabsPanel from "../components/TabsPanel";
import QrModal from "../components/QrModal";
import ConfirmModal from "../components/ConfirmModal";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth();

  // Base API configuration
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // URL Shortening States
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [topic, setTopic] = useState("General");
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenError, setShortenError] = useState("");
  const [shortenResult, setShortenResult] = useState(null);

  // Stats Lookup States
  const [lookupCode, setLookupCode] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsResult, setStatsResult] = useState(null);

  // Popular URLs Leaderboard States
  const [popularUrls, setPopularUrls] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  // Personal Links States
  const [userUrls, setUserUrls] = useState([]);
  const [userUrlsLoading, setUserUrlsLoading] = useState(false);
  const [userUrlsError, setUserUrlsError] = useState("");
  const [activeTab, setActiveTab] = useState("leaderboard");

  // QR Code Modal State
  const [activeQrLink, setActiveQrLink] = useState(null);

  // Sign Out Modal State
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");

  // Copy helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const copyToClipboard = (text, label = "Link") => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError("");
      const res = await fetch(`${API_BASE}/stats/popular`, {
        credentials: "include", // Send session token cookies
      });
      if (!res.ok) {
        throw new Error("Failed to fetch popular URLs");
      }
      const data = await res.json();
      setPopularUrls(data);
    } catch (err) {
      console.error(err);
      setLeaderboardError("Failed to fetch leaderboard data.");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Fetch User's Personal Links
  const fetchUserUrls = async () => {
    if (!user) return;
    try {
      setUserUrlsLoading(true);
      setUserUrlsError("");
      const res = await fetch(`${API_BASE}/urls/my`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch your URLs");
      }
      const data = await res.json();
      setUserUrls(data);
    } catch (err) {
      setUserUrlsError(err.message || "Failed to load links");
    } finally {
      setUserUrlsLoading(false);
    }
  };

  // Run initial fetch on mount
  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync active tab and load links on user state change
  useEffect(() => {
    if (user) {
      fetchUserUrls();
      setActiveTab("my-links");
    } else {
      setActiveTab("leaderboard");
      setUserUrls([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Background focus-sensitive auto-refresh for click counts every 10 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Pause polling if the tab is in the background to save server resources
      if (document.visibilityState !== "visible") return;

      if (activeTab === "my-links" && user) {
        // Fetch silently without toggling loading screen state to prevent flickering
        fetch(`${API_BASE}/urls/my`, { credentials: "include" })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then((data) => setUserUrls(data))
          .catch(() => { });
      } else if (activeTab === "leaderboard") {
        fetch(`${API_BASE}/stats/popular`, { credentials: "include" })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then((data) => setPopularUrls(data))
          .catch(() => { });
      }
    }, 10000); // 10 seconds interval

    return () => clearInterval(syncInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // Handle URL shortening
  const handleShorten = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    const startTime = Date.now();
    try {
      setShortenLoading(true);
      setShortenError("");

      const res = await fetch(`${API_BASE}/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          longUrl,
          customAlias: customAlias.trim() || undefined,
          topic: topic || undefined,
        }),
        credentials: "include", // Send session token cookies
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to shorten URL");
      }

      // Enforce 600ms minimum loading time to avoid visual flash/flicker
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsedTime));
      }

      const shortCode = data.shortUrl.split("/").pop();
      setShortenResult({
        shortUrl: data.shortUrl,
        topic: data.topic,
        shortCode,
        originalUrl: longUrl,
      });
      showToast("URL shortened successfully");

      // Auto refresh leaderboard and user history since there is a new link
      fetchLeaderboard();
      fetchUserUrls();
    } catch (err) {
      // Ensure smooth skeleton exit transition even on early failure
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsedTime));
      }
      setShortenError(err.message || "An unexpected error occurred");
    } finally {
      setShortenLoading(false);
    }
  };

  // Handle stats lookup query
  const handleLookup = async (e) => {
    e.preventDefault();
    const code = lookupCode.trim().split("/").pop();
    if (!code) return;

    const startTime = Date.now();
    try {
      setStatsLoading(true);
      setStatsError("");

      const res = await fetch(`${API_BASE}/stats/${code}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Code not found");
      }

      // Enforce 600ms minimum loading time to avoid visual flash/flicker
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsedTime));
      }

      setStatsResult(data);
    } catch (err) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsedTime));
      }
      setStatsError(err.message || "Code not found or server offline");
    } finally {
      setStatsLoading(false);
    }
  };

  // Helper to load stats for a specific code
  const loadStatsForCode = (code) => {
    setLookupCode(code);
    setTimeout(() => {
      const form = document.getElementById("stats-lookup-form");
      if (form) {
        form.requestSubmit();
      }
      document.getElementById("stats-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  if (authLoading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-screen bg-background">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10 relative">
      {/* Muted Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded border border-border shadow-lg text-xs font-medium transition-all">
          {toastMessage}
        </div>
      )}

      {/* Header component */}
      <Header
        user={user}
        authLoading={authLoading}
        onSignOutClick={() => setIsSignOutOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Grid Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shortener tool and stats */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <ShortenForm
            user={user}
            authLoading={authLoading}
            longUrl={longUrl}
            setLongUrl={setLongUrl}
            customAlias={customAlias}
            setCustomAlias={setCustomAlias}
            topic={topic}
            setTopic={setTopic}
            shortenLoading={shortenLoading}
            shortenError={shortenError}
            shortenResult={shortenResult}
            handleShorten={handleShorten}
            copyToClipboard={copyToClipboard}
          />

          <AnalyticsLookup
            lookupCode={lookupCode}
            setLookupCode={setLookupCode}
            statsLoading={statsLoading}
            statsError={statsError}
            statsResult={statsResult}
            handleLookup={handleLookup}
          />
        </div>

        {/* Right Column: Dynamic Tabs (My Links / Leaderboard) */}
        <div className="flex flex-col gap-6">
          <TabsPanel
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userUrls={userUrls}
            userUrlsLoading={userUrlsLoading}
            userUrlsError={userUrlsError}
            fetchUserUrls={fetchUserUrls}
            popularUrls={popularUrls}
            leaderboardLoading={leaderboardLoading}
            leaderboardError={leaderboardError}
            fetchLeaderboard={fetchLeaderboard}
            copyToClipboard={copyToClipboard}
            loadStatsForCode={loadStatsForCode}
            setActiveQrLink={setActiveQrLink}
            API_BASE={API_BASE}
          />
        </div>
      </main>

      {/* QR Code Modal Overlay */}
      <QrModal activeQrLink={activeQrLink} setActiveQrLink={setActiveQrLink} />

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
      />

      {/* Minimal Footer */}
      <footer className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
        <span className="text-center sm:text-left">
          Distributed Coordination & Real-time Caching Enabled
        </span>
        <span>&copy; {new Date().getFullYear()} Shorten.it</span>
      </footer>
    </div>
  );
}
