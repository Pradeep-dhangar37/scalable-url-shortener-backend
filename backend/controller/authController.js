import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const getJwtSecret = () => process.env.JWT_SECRET;

// Helper to set HTTP-only cookie
const setTokenCookie = (res, token) => {
  res.cookie("shorten_session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

// REGISTER USER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    logger.info("Registration attempt for email:", email);

    if (!name || !email || !password) {
      logger.warn("Registration rejected: name, email, or password missing");
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration rejected: email ${email} already in use`);
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ userId: newUser._id }, getJwtSecret(), { expiresIn: "7d" });

    // Set cookie
    setTokenCookie(res, token);
    logger.success(`Registration successful: created user ${newUser.email} (${newUser._id})`);

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    logger.error("Error in register:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// LOGIN USER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info("Login attempt for email:", email);

    if (!email || !password) {
      logger.warn("Login rejected: email or password missing");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login rejected: no account found for email ${email}`);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Standard credential accounts must have a password
    if (!user.password) {
      logger.warn(`Login rejected: email ${email} registered via Google OAuth`);
      return res.status(400).json({ error: "Please log in using Google OAuth" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login rejected: incorrect password for email ${email}`);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: "7d" });

    // Set cookie
    setTokenCookie(res, token);
    logger.success(`Login successful: authenticated user ${user.email} (${user._id})`);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error("Error in login:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GOOGLE OAUTH LOGIN
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    logger.info("Google OAuth login request received");

    if (!credential) {
      logger.warn("Google login rejected: credential token missing");
      return res.status(400).json({ error: "Google credential token required" });
    }

    // Verify Google ID Token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      logger.error("Google token verification failed:", verifyErr.message);
      return res.status(400).json({ error: "Google token verification failed" });
    }

    const { email, name, sub: googleId } = payload;
    logger.info(`Google token verified. Email: ${email}, Google ID: ${googleId}`);

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but googleId is not bound yet, link it
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
        logger.info(`Bound Google ID to existing email account: ${email}`);
      }
    } else {
      // Create new user (password is not set for OAuth accounts)
      user = new User({
        email,
        name,
        googleId,
      });
      await user.save();
      logger.success(`Google signup successful: created user ${email}`);
    }

    // Generate custom JWT
    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: "7d" });

    // Set cookie
    setTokenCookie(res, token);
    logger.success(`Google login successful: authenticated user ${user.email} (${user._id})`);

    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error("Error in googleLogin:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// LOGOUT USER (Clear Cookie)
export const logout = async (req, res) => {
  try {
    logger.info("Logout request received");
    res.clearCookie("shorten_session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    logger.success("Logout successful: cleared session token cookie");
    res.json({ message: "Logout successful" });
  } catch (err) {
    logger.error("Error in logout:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET ME (Fetch profile of currently logged-in user)
export const getMe = async (req, res) => {
  try {
    logger.info("Profile check requested for session");
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      logger.warn(`Profile check failed: user ID ${req.user.userId} not found in database`);
      return res.status(404).json({ error: "User not found" });
    }
    logger.success(`Profile check successful: retrieved user details for ${user.email}`);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error("Error in getMe:", err.message);
    res.status(500).json({ error: err.message });
  }
};
