import jwt from "jsonwebtoken";

// Helper to parse cookies from headers
const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift().trim()] = decodeURI(parts.join("="));
  });
  return list;
};

// Strict Authentication Middleware (Requires user to be logged in)
export const requireAuth = (req, res, next) => {
  try {
    let token = null;

    // 1. Check cookies
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.shorten_session_token) {
      token = cookies.shorten_session_token;
    }

    // 2. Check Authorization header fallback
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Optional Authentication Middleware (Allows anonymous operations, but binds user details if logged in)
export const optionalAuth = (req, res, next) => {
  try {
    let token = null;

    const cookies = parseCookies(req.headers.cookie);
    if (cookies.shorten_session_token) {
      token = cookies.shorten_session_token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      req.user = decoded;
    }
  } catch (err) {
    // Gracefully ignore error for optional auth and continue anonymous flow
    console.log("Optional Auth: Token verification failed (continuing anonymously)", err.message);
  }
  next();
};
