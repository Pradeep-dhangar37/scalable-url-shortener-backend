"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-provider";
import { Link2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, login, register, googleLogin } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Handle Google OAuth callback
  const handleGoogleCallback = async (response) => {
    try {
      setLoading(true);
      setError("");
      await googleLogin(response.credential);
      router.push("/");
    } catch (err) {
      setError(err.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google One Tap / Sign In button
  useEffect(() => {
    const initGoogleSDK = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID env variable is not configured.");
        return;
      }

      if (window.google?.accounts?.id) {
        if (!window.google_initialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
          });
          window.google_initialized = true;
        }

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 320,
          });
        }
      }
    };

    // If script already loaded, initialize
    if (window.google?.accounts?.id) {
      initGoogleSDK();
    } else {
      // Add event listener to check script load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleSDK();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  // Submit standard registration or login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill out all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col justify-center items-center px-4 py-16 relative">
      
      {/* Return to console */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Console
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-5 h-5 text-foreground" />
            <span className="font-mono font-bold text-lg tracking-tight text-foreground">
              Shorten.it
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Access secure link shortener dashboard
          </p>
        </div>

        {/* Auth Card */}
        <div className="border border-border bg-card rounded-lg p-6 shadow-sm space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-border text-center">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                isLogin
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                !isLogin
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-transparent focus:outline-none focus:border-foreground text-foreground transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/5 text-red-600 dark:text-red-400 text-xs font-medium rounded border border-red-500/10 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent text-accent-foreground font-semibold rounded hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {loading ? "Authenticating..." : isLogin ? "Sign In" : "Register"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              or
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Google Sign In Wrapper */}
          <div className="flex flex-col items-center justify-center">
            <div ref={googleBtnRef} className="w-full flex justify-center"></div>
            {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <span className="text-[10px] text-muted-foreground mt-2 text-center">
                Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID in env to enable Google Login
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
