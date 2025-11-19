import "dotenv/config";

import cors from "cors";
import express from "express";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import {
  signupSchema,
  loginSchema,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "./auth";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  ALLOWED_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().default("your-secret-key-change-in-production"),
});

const config = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
});

const app = express();
const sql = neon(config.DATABASE_URL);

app.use(
  cors({
    origin: config.ALLOWED_ORIGINS
      ? config.ALLOWED_ORIGINS.split(",").map((value) => value.trim())
      : true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const [row] =
      await sql`select 'ok' as status, version() as database_version, now() as timestamp`;
    res.json({ ok: true, ...row });
  } catch (error) {
    console.error("Health check failed", error);
    res.status(500).json({ ok: false, error: "Unable to reach NeonDB" });
  }
});

app.get("/api/templates", async (_req, res) => {
  try {
    const rows =
      await sql`select *
                from (values
                  ('Hero section', 'High-impact hero layout for product launches', 'hero'),
                  ('Testimonials', 'Showcase customer quotes to build trust', 'testimonials'),
                  ('Pricing table', 'Three-tier pricing grid with CTA', 'pricing')
                ) as templates(title, description, slug)`;
    res.json({ items: rows });
  } catch (error) {
    console.error("Template query failed", error);
    res.status(500).json({ message: "Failed to load template presets" });
  }
});

// Authentication endpoints
app.post("/api/auth/signup", async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${body.email}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${body.name}, ${body.email}, ${passwordHash})
      RETURNING id, email, name, created_at
    `;

    const newUser = result[0];
    if (!newUser) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    // Generate token
    const token = generateToken(newUser.id, newUser.email);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Signup failed", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    // Find user
    const [user] = await sql`
      SELECT id, email, name, password_hash FROM users WHERE email = ${body.email}
    `;

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isValid = await comparePassword(body.password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Login failed", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { googleId, email, name, avatarUrl } = z
      .object({
        googleId: z.string(),
        email: z.string().email(),
        name: z.string(),
        avatarUrl: z.string().url().optional(),
      })
      .parse(req.body);

    // Check if user exists with Google ID
    const googleUserResult = await sql`
      SELECT id, email, name FROM users WHERE google_id = ${googleId}
    `;
    let user = googleUserResult[0];

    if (!user) {
      // Check if user exists with email
      const emailUserResult = await sql`
        SELECT id, email, name FROM users WHERE email = ${email}
      `;
      const existingUser = emailUserResult[0];

      if (existingUser) {
        // Link Google account to existing user
        await sql`
          UPDATE users 
          SET google_id = ${googleId}, avatar_url = ${avatarUrl || null}
          WHERE id = ${existingUser.id}
        `;
        user = existingUser;
      } else {
        // Create new user
        const newUserResult = await sql`
          INSERT INTO users (email, name, google_id, avatar_url)
          VALUES (${email}, ${name}, ${googleId}, ${avatarUrl || null})
          RETURNING id, email, name
        `;
        const newUser = newUserResult[0];
        if (!newUser) {
          return res.status(500).json({ message: "Failed to create user" });
        }
        user = newUser;
      }
    }

    if (!user) {
      return res.status(500).json({ message: "Failed to authenticate" });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      message: "Google authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Google auth failed", error);
    res.status(500).json({ message: "Failed to authenticate with Google" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const [user] = await sql`
      SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ${decoded.userId}
    `;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Auth check failed", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(config.PORT, () => {
  console.log(`API ready on http://localhost:${config.PORT}`);
});

