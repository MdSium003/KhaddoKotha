import "dotenv/config";

import cors from "cors";
import express from "express";
import { neon } from "@neondatabase/serverless";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  GEMINI_API_KEY: z.string().optional(),
});

const config = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});

const app = express();
const sql = neon(config.DATABASE_URL);
const genAI = config.GEMINI_API_KEY ? new GoogleGenerativeAI(config.GEMINI_API_KEY) : null;
console.log("Gemini API Key configured:", !!config.GEMINI_API_KEY);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // If ALLOWED_ORIGINS is set, check against it
      if (config.ALLOWED_ORIGINS) {
        const allowedOrigins = config.ALLOWED_ORIGINS.split(",").map((value) => value.trim());
        // Also allow localhost and common network IPs in development
        const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
        const isNetworkIP = /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
          /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
          /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin);

        if (allowedOrigins.includes(origin) || isLocalhost || isNetworkIP) {
          return callback(null, true);
        }
        // In development, allow all origins if it's a network IP
        if (process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      }

      // If no ALLOWED_ORIGINS is set, allow all origins
      callback(null, true);
    },
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

app.get("/api/inventory", async (_req, res) => {
  try {
    const rows = await sql`
      SELECT id, item_name, category, expiration_days, cost_per_unit
      FROM food_inventory
      ORDER BY category, item_name
    `;
    res.json({ items: rows });
  } catch (error) {
    console.error("Inventory query failed", error);
    res.status(500).json({ message: "Failed to load food inventory" });
  }
});

app.get("/api/resources", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const type = req.query.type as string | undefined;

    let rows;
    if (category && type) {
      rows = await sql`
        SELECT id, title, description, url, category, type, created_at
        FROM resources
        WHERE category = ${category} AND type = ${type}
        ORDER BY title
      `;
    } else if (category) {
      rows = await sql`
        SELECT id, title, description, url, category, type, created_at
        FROM resources
        WHERE category = ${category}
        ORDER BY title
      `;
    } else if (type) {
      rows = await sql`
        SELECT id, title, description, url, category, type, created_at
        FROM resources
        WHERE type = ${type}
        ORDER BY category, title
      `;
    } else {
      rows = await sql`
        SELECT id, title, description, url, category, type, created_at
        FROM resources
        ORDER BY category, title
      `;
    }

    res.json({ resources: rows });
  } catch (error) {
    console.error("Resources query failed", error);
    res.status(500).json({ message: "Failed to load resources" });
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
        avatarUrl: undefined,
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
      SELECT id, email, name, password_hash, avatar_url FROM users WHERE email = ${body.email}
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
        avatarUrl: user.avatar_url || undefined,
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
    const body = z
      .object({
        googleId: z.string().min(1),
        email: z.string().email(),
        name: z.string().min(1),
        avatarUrl: z.union([z.string().url(), z.literal("")]).optional(),
      })
      .parse(req.body);

    const { googleId, email, name, avatarUrl } = body;

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
          SET google_id = ${googleId}, avatar_url = ${avatarUrl && avatarUrl !== "" ? avatarUrl : null}
          WHERE id = ${existingUser.id}
        `;
        user = existingUser;
      } else {
        // Create new user
        const newUserResult = await sql`
          INSERT INTO users (email, name, google_id, avatar_url)
          VALUES (${email}, ${name}, ${googleId}, ${avatarUrl && avatarUrl !== "" ? avatarUrl : null})
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
      SELECT id, email, name, avatar_url, budget_preferences, dietary_needs, created_at 
      FROM users WHERE id = ${decoded.userId}
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
        budgetPreferences: user.budget_preferences,
        dietaryNeeds: user.dietary_needs,
      },
    });
  } catch (error) {
    console.error("Auth check failed", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

app.put("/api/auth/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const body = z
      .object({
        name: z.string().min(1).optional(),
        budgetPreferences: z.enum(["low", "medium", "high"]).optional(),
        dietaryNeeds: z.string().max(500).optional(),
      })
      .parse(req.body);

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (body.name !== undefined) {
      updateFields.push("name = $" + (updateValues.length + 1));
      updateValues.push(body.name);
    }

    if (body.budgetPreferences !== undefined) {
      updateFields.push("budget_preferences = $" + (updateValues.length + 1));
      updateValues.push(body.budgetPreferences);
    }

    if (body.dietaryNeeds !== undefined) {
      updateFields.push("dietary_needs = $" + (updateValues.length + 1));
      updateValues.push(body.dietaryNeeds);
    }

    if (Object.keys(body).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Update fields individually if provided
    if (body.name !== undefined) {
      await sql`UPDATE users SET name = ${body.name} WHERE id = ${decoded.userId}`;
    }
    if (body.budgetPreferences !== undefined) {
      await sql`UPDATE users SET budget_preferences = ${body.budgetPreferences} WHERE id = ${decoded.userId}`;
    }
    if (body.dietaryNeeds !== undefined) {
      await sql`UPDATE users SET dietary_needs = ${body.dietaryNeeds} WHERE id = ${decoded.userId}`;
    }

    // Always update the updated_at timestamp
    await sql`UPDATE users SET updated_at = NOW() WHERE id = ${decoded.userId}`;

    // Fetch the updated user
    const [updatedUser] = await sql`
      SELECT id, email, name, avatar_url, budget_preferences, dietary_needs
      FROM users
      WHERE id = ${decoded.userId}
    `;

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatar_url,
        budgetPreferences: updatedUser.budget_preferences,
        dietaryNeeds: updatedUser.dietary_needs,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Profile update failed", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Food usage endpoints
app.post("/api/food-usage", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const body = z
      .object({
        itemName: z.string().min(1),
        quantity: z.coerce.number().positive(),
        category: z.string().min(1),
        usageDate: z.string().optional(),
      })
      .parse(req.body);

    const usageDate = body.usageDate
      ? new Date(body.usageDate)
      : new Date();

    const [log] = await sql`
      INSERT INTO food_usage_logs (user_id, item_name, quantity, category, usage_date)
      VALUES (${decoded.userId}, ${body.itemName}, ${body.quantity}, ${body.category}, ${usageDate.toISOString().split('T')[0]})
      RETURNING id, item_name, quantity, category, usage_date, created_at
    `;

    res.status(201).json({
      message: "Food usage logged successfully",
      log: {
        id: log.id,
        itemName: log.item_name,
        quantity: Number(log.quantity),
        category: log.category,
        usageDate: log.usage_date,
        createdAt: log.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Food usage log failed", error);
    res.status(500).json({ message: "Failed to log food usage" });
  }
});

app.post("/api/food-usage/bulk", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const body = z
      .object({
        logs: z.array(
          z.object({
            itemName: z.string().min(1),
            quantity: z.coerce.number().positive(),
            category: z.string().min(1),
            usageDate: z.string().optional(),
          })
        ),
      })
      .parse(req.body);

    const usageDate = body.logs[0]?.usageDate
      ? new Date(body.logs[0].usageDate)
      : new Date();
    const dateStr = usageDate.toISOString().split('T')[0];

    const insertedLogs = [];
    for (const log of body.logs) {
      try {
        const [inserted] = await sql`
          INSERT INTO food_usage_logs (user_id, item_name, quantity, category, usage_date)
          VALUES (${decoded.userId}, ${log.itemName}, ${log.quantity}, ${log.category}, ${dateStr})
          RETURNING id, item_name, quantity, category, usage_date, created_at
        `;
        insertedLogs.push({
          id: inserted.id,
          itemName: inserted.item_name,
          quantity: Number(inserted.quantity),
          category: inserted.category,
          usageDate: inserted.usage_date,
          createdAt: inserted.created_at,
        });
      } catch (err) {
        console.error(`Failed to insert log for ${log.itemName}:`, err);
      }
    }

    res.status(201).json({
      message: `Successfully logged ${insertedLogs.length} food usage entries`,
      logs: insertedLogs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Bulk food usage log failed", error);
    res.status(500).json({ message: "Failed to log food usage" });
  }
});

app.get("/api/food-usage", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const date = req.query.date as string | undefined;
    const dateFilter = date ? new Date(date) : new Date();
    const dateStr = dateFilter.toISOString().split('T')[0];

    const logs = await sql`
      SELECT id, item_name, quantity, category, usage_date, created_at
      FROM food_usage_logs
      WHERE user_id = ${decoded.userId}
        AND usage_date = ${dateStr}
      ORDER BY created_at DESC
    `;

    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        itemName: log.item_name,
        quantity: Number(log.quantity),
        category: log.category,
        usageDate: log.usage_date,
        createdAt: log.created_at,
      })),
    });
  } catch (error) {
    console.error("Get food usage failed", error);
    res.status(500).json({ message: "Failed to fetch food usage logs" });
  }
});

// Food usage analytics endpoint
app.get("/api/food-usage/analytics", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Get data for the last 4 weeks to identify trends
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

    // Fetch all logs from the last 4 weeks
    const allLogs = await sql`
      SELECT id, item_name, quantity, category, usage_date, created_at
      FROM food_usage_logs
      WHERE user_id = ${decoded.userId}
        AND usage_date >= ${fourWeeksAgoStr}
      ORDER BY usage_date DESC
    `;

    // Convert to proper format
    const logs = allLogs.map((log) => ({
      id: log.id,
      itemName: log.item_name,
      quantity: Number(log.quantity),
      category: log.category,
      usageDate: log.usage_date,
      createdAt: log.created_at,
    }));

    // Calculate weekly trends
    const weeklyTrends = calculateWeeklyTrends(logs);

    // Detect consumption patterns
    const consumptionPatterns = detectConsumptionPatterns(logs);

    // Detect imbalanced patterns
    const imbalancedPatterns = detectImbalancedPatterns(weeklyTrends, consumptionPatterns);

    // Generate heatmap data
    const heatmapData = generateHeatmapData(weeklyTrends, consumptionPatterns);

    // Generate insights
    const insights = generateInsights(weeklyTrends, consumptionPatterns);

    res.json({
      weeklyTrends,
      consumptionPatterns,
      insights,
      imbalancedPatterns,
      heatmapData,
      totalLogsAnalyzed: logs.length,
    });
  } catch (error) {
    console.error("Get food usage analytics failed", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Helper function to calculate weekly trends
function calculateWeeklyTrends(logs: any[]) {
  const weeks = [];
  const now = new Date();

  // Create 4 weeks of data
  for (let i = 0; i < 4; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const weekLogs = logs.filter(log => {
      return log.usageDate >= weekStartStr && log.usageDate <= weekEndStr;
    });

    const categoryBreakdown: Record<string, { count: number; quantity: number }> = {};
    let totalItems = 0;
    let totalQuantity = 0;

    weekLogs.forEach(log => {
      if (!categoryBreakdown[log.category]) {
        categoryBreakdown[log.category] = { count: 0, quantity: 0 };
      }
      categoryBreakdown[log.category].count++;
      categoryBreakdown[log.category].quantity += log.quantity;
      totalItems++;
      totalQuantity += log.quantity;
    });

    weeks.push({
      weekNumber: 4 - i,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalItems,
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      categoryBreakdown,
    });
  }

  return weeks.reverse(); // Return in chronological order
}

// Helper function to detect consumption patterns
function detectConsumptionPatterns(logs: any[]) {
  const categoryStats: Record<string, {
    totalQuantity: number;
    itemCount: number;
    weeklyAverage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    status: 'normal' | 'over-consumption' | 'under-consumption';
  }> = {};

  // Group by category
  const categorizedLogs: Record<string, any[]> = {};
  logs.forEach(log => {
    if (!categorizedLogs[log.category]) {
      categorizedLogs[log.category] = [];
    }
    categorizedLogs[log.category].push(log);
  });

  // Analyze each category
  Object.keys(categorizedLogs).forEach(category => {
    const categoryLogs = categorizedLogs[category];
    const totalQuantity = categoryLogs.reduce((sum, log) => sum + log.quantity, 0);
    const itemCount = categoryLogs.length;
    const weeklyAverage = totalQuantity / 4; // 4 weeks of data

    // Calculate trend by comparing first 2 weeks vs last 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const recentLogs = categoryLogs.filter(log => log.usageDate >= twoWeeksAgoStr);
    const olderLogs = categoryLogs.filter(log => log.usageDate < twoWeeksAgoStr);

    const recentQuantity = recentLogs.reduce((sum, log) => sum + log.quantity, 0);
    const olderQuantity = olderLogs.reduce((sum, log) => sum + log.quantity, 0);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentQuantity > olderQuantity * 1.2) {
      trend = 'increasing';
    } else if (recentQuantity < olderQuantity * 0.8) {
      trend = 'decreasing';
    }

    // Determine consumption status based on weekly average
    // These thresholds can be adjusted based on category
    let status: 'normal' | 'over-consumption' | 'under-consumption' = 'normal';

    // Category-specific thresholds (simplified - can be made more sophisticated)
    const thresholds: Record<string, { high: number; low: number }> = {
      'fruit': { high: 15, low: 3 },
      'vegetable': { high: 20, low: 5 },
      'dairy': { high: 10, low: 2 },
      'protein': { high: 12, low: 3 },
      'grain': { high: 15, low: 4 },
      'default': { high: 10, low: 2 },
    };

    const threshold = thresholds[category.toLowerCase()] || thresholds['default'];

    if (weeklyAverage > threshold.high) {
      status = 'over-consumption';
    } else if (weeklyAverage < threshold.low && itemCount > 0) {
      status = 'under-consumption';
    }

    categoryStats[category] = {
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      itemCount,
      weeklyAverage: Math.round(weeklyAverage * 100) / 100,
      trend,
      status,
    };
  });

  return categoryStats;
}

// Helper function to generate insights
function generateInsights(weeklyTrends: any[], consumptionPatterns: any) {
  const insights = [];

  // Analyze overall trend
  if (weeklyTrends.length >= 2) {
    const latestWeek = weeklyTrends[weeklyTrends.length - 1];
    const previousWeek = weeklyTrends[weeklyTrends.length - 2];

    if (latestWeek.totalQuantity > previousWeek.totalQuantity * 1.3) {
      insights.push({
        type: 'warning',
        category: 'overall',
        message: `Your food consumption increased by ${Math.round(((latestWeek.totalQuantity - previousWeek.totalQuantity) / previousWeek.totalQuantity) * 100)}% this week`,
        recommendation: 'Consider meal planning to optimize your food usage and reduce potential waste.',
      });
    } else if (latestWeek.totalQuantity < previousWeek.totalQuantity * 0.7) {
      insights.push({
        type: 'info',
        category: 'overall',
        message: `Your food consumption decreased by ${Math.round(((previousWeek.totalQuantity - latestWeek.totalQuantity) / previousWeek.totalQuantity) * 100)}% this week`,
        recommendation: 'Great job on mindful consumption! Make sure you\'re meeting your nutritional needs.',
      });
    }
  }

  // Analyze category-specific patterns
  Object.entries(consumptionPatterns).forEach(([category, stats]: [string, any]) => {
    if (stats.status === 'over-consumption') {
      insights.push({
        type: 'warning',
        category,
        message: `High ${category} consumption detected (${stats.weeklyAverage} units/week)`,
        recommendation: `Consider reducing ${category} intake or ensure proper storage to prevent waste.`,
      });
    } else if (stats.status === 'under-consumption') {
      insights.push({
        type: 'info',
        category,
        message: `Low ${category} consumption detected (${stats.weeklyAverage} units/week)`,
        recommendation: `Ensure you're getting enough ${category} in your diet for balanced nutrition.`,
      });
    }

    if (stats.trend === 'increasing') {
      insights.push({
        type: 'info',
        category,
        message: `${category} consumption is trending upward`,
        recommendation: `Monitor your ${category} inventory to avoid over-purchasing and potential waste.`,
      });
    } else if (stats.trend === 'decreasing') {
      insights.push({
        type: 'info',
        category,
        message: `${category} consumption is trending downward`,
        recommendation: `Adjust your shopping list to match your current ${category} consumption patterns.`,
      });
    }
  });

  // If no insights, add a positive message
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      category: 'overall',
      message: 'Your consumption patterns look healthy and balanced!',
      recommendation: 'Keep up the good work with mindful food management.',
    });
  }

  return insights;
}

// Helper function to detect imbalanced patterns
function detectImbalancedPatterns(weeklyTrends: any[], consumptionPatterns: any) {
  const imbalances = [];

  // 1. Check for category dominance (one category > 50% of total consumption)
  const totalConsumption = Object.values(consumptionPatterns).reduce(
    (sum: number, pattern: any) => sum + pattern.totalQuantity,
    0
  );

  if (totalConsumption > 0) {
    Object.entries(consumptionPatterns).forEach(([category, pattern]: [string, any]) => {
      const percentage = (pattern.totalQuantity / totalConsumption) * 100;
      if (percentage > 50) {
        imbalances.push({
          type: 'category_dominance',
          category,
          severity: percentage > 70 ? 'high' : 'medium',
          message: `${category} accounts for ${Math.round(percentage)}% of your total consumption`,
          recommendation: `Consider diversifying your diet to include more variety across food categories for balanced nutrition.`,
        });
      }
    });
  }

  // 2. Check for high week-to-week variance (coefficient of variation > 0.5)
  if (weeklyTrends.length >= 2) {
    const weeklyQuantities = weeklyTrends.map(week => week.totalQuantity);
    const mean = weeklyQuantities.reduce((a, b) => a + b, 0) / weeklyQuantities.length;
    const variance = weeklyQuantities.reduce((sum, qty) => sum + Math.pow(qty - mean, 2), 0) / weeklyQuantities.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    if (coefficientOfVariation > 0.5) {
      imbalances.push({
        type: 'high_variance',
        severity: coefficientOfVariation > 0.8 ? 'high' : 'medium',
        message: `Your consumption varies significantly week-to-week (${Math.round(coefficientOfVariation * 100)}% variation)`,
        recommendation: `Try to maintain more consistent consumption patterns to better plan your shopping and reduce waste.`,
      });
    }
  }

  // 3. Check for distribution imbalance (few categories dominate)
  if (Object.keys(consumptionPatterns).length >= 3) {
    const sortedCategories = Object.entries(consumptionPatterns)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.totalQuantity - a.totalQuantity)
      .slice(0, 2);

    const topTwoTotal = sortedCategories.reduce(
      (sum, [, pattern]: [string, any]) => sum + pattern.totalQuantity,
      0
    );
    const topTwoPercentage = totalConsumption > 0 ? (topTwoTotal / totalConsumption) * 100 : 0;

    if (topTwoPercentage > 75) {
      const topCategories = sortedCategories.map(([cat]) => cat).join(' and ');
      imbalances.push({
        type: 'distribution_imbalance',
        severity: topTwoPercentage > 85 ? 'high' : 'medium',
        message: `${topCategories} account for ${Math.round(topTwoPercentage)}% of your consumption`,
        recommendation: `Your diet is heavily concentrated in a few categories. Consider adding more variety for nutritional balance.`,
      });
    }
  }

  // 4. Check for extreme week differences (>100% change)
  if (weeklyTrends.length >= 2) {
    for (let i = 1; i < weeklyTrends.length; i++) {
      const currentWeek = weeklyTrends[i].totalQuantity;
      const previousWeek = weeklyTrends[i - 1].totalQuantity;
      
      if (previousWeek > 0) {
        const change = Math.abs((currentWeek - previousWeek) / previousWeek);
        if (change > 1.0) {
          const direction = currentWeek > previousWeek ? 'increase' : 'decrease';
          const percentage = Math.round(change * 100);
          imbalances.push({
            type: 'extreme_week_change',
            severity: 'high',
            message: `Week ${weeklyTrends[i].weekNumber} showed a ${percentage}% ${direction} compared to the previous week`,
            recommendation: `Such dramatic changes can lead to waste or nutritional gaps. Try to maintain more consistent consumption.`,
          });
          break; // Only flag the most recent extreme change
        }
      }
    }
  }

  return imbalances;
}

// Helper function to generate heatmap data
function generateHeatmapData(weeklyTrends: any[], consumptionPatterns: any) {
  // Get all unique categories
  const allCategories = Object.keys(consumptionPatterns);
  
  // If no categories, return empty data
  if (allCategories.length === 0) {
    return {
      categories: [],
      weeks: [],
      data: [],
      maxValue: 0,
    };
  }

  // Create heatmap data structure: category x week
  const heatmapData: Array<{ category: string; week: number; value: number }> = [];
  
  // Calculate max value for normalization
  let maxValue = 0;

  allCategories.forEach(category => {
    weeklyTrends.forEach(week => {
      const categoryData = week.categoryBreakdown[category];
      const value = categoryData ? categoryData.quantity : 0;
      heatmapData.push({
        category,
        week: week.weekNumber,
        value: Math.round(value * 100) / 100,
      });
      if (value > maxValue) {
        maxValue = value;
      }
    });
  });

  // Generate week labels
  const weekLabels = weeklyTrends.map(week => ({
    weekNumber: week.weekNumber,
    label: `Week ${week.weekNumber}`,
    dateRange: `${new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
  }));

  return {
    categories: allCategories.sort(),
    weeks: weekLabels,
    data: heatmapData,
    maxValue: Math.round(maxValue * 100) / 100,
  };
}

// User inventory endpoints
app.get("/api/user-inventory", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const items = await sql`
      SELECT id, item_name, quantity, category, purchase_date, expiration_date, notes, created_at, updated_at
      FROM user_inventory
      WHERE user_id = ${decoded.userId}
      ORDER BY expiration_date ASC NULLS LAST, item_name ASC
    `;

    res.json({
      items: items.map((item) => ({
        id: item.id,
        itemName: item.item_name,
        quantity: Number(item.quantity),
        category: item.category,
        purchaseDate: item.purchase_date,
        expirationDate: item.expiration_date,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get user inventory failed", error);
    res.status(500).json({ message: "Failed to fetch user inventory" });
  }
});

app.post("/api/user-inventory", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const body = z
      .object({
        itemName: z.string().min(1),
        quantity: z.coerce.number().positive(),
        category: z.string().min(1),
        purchaseDate: z.string().optional(),
        expirationDate: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const [item] = await sql`
      INSERT INTO user_inventory (user_id, item_name, quantity, category, purchase_date, expiration_date, notes)
      VALUES (
        ${decoded.userId},
        ${body.itemName},
        ${body.quantity},
        ${body.category},
        ${body.purchaseDate || null},
        ${body.expirationDate || null},
        ${body.notes || null}
      )
      RETURNING id, item_name, quantity, category, purchase_date, expiration_date, notes, created_at, updated_at
    `;

    res.status(201).json({
      message: "Item added to inventory successfully",
      item: {
        id: item.id,
        itemName: item.item_name,
        quantity: Number(item.quantity),
        category: item.category,
        purchaseDate: item.purchase_date,
        expirationDate: item.expiration_date,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Add inventory item failed", error);
    res.status(500).json({ message: "Failed to add item to inventory" });
  }
});

app.post("/api/user-inventory/bulk", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const body = z
      .object({
        items: z.array(
          z.object({
            itemName: z.string().min(1),
            quantity: z.coerce.number().positive(),
            category: z.string().min(1),
            purchaseDate: z.string().optional(),
            expirationDate: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      })
      .parse(req.body);

    const insertedItems = [];
    for (const item of body.items) {
      try {
        const [inserted] = await sql`
          INSERT INTO user_inventory (user_id, item_name, quantity, category, purchase_date, expiration_date, notes)
          VALUES (
            ${decoded.userId},
            ${item.itemName},
            ${item.quantity},
            ${item.category},
            ${item.purchaseDate || null},
            ${item.expirationDate || null},
            ${item.notes || null}
          )
          RETURNING id, item_name, quantity, category, purchase_date, expiration_date, notes, created_at, updated_at
        `;
        insertedItems.push({
          id: inserted.id,
          itemName: inserted.item_name,
          quantity: Number(inserted.quantity),
          category: inserted.category,
          purchaseDate: inserted.purchase_date,
          expirationDate: inserted.expiration_date,
          notes: inserted.notes,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        });
      } catch (err) {
        console.error(`Failed to insert item ${item.itemName}:`, err);
      }
    }

    res.status(201).json({
      message: `Successfully added ${insertedItems.length} items to inventory`,
      items: insertedItems,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Bulk add inventory failed", error);
    res.status(500).json({ message: "Failed to add items to inventory" });
  }
});

app.put("/api/user-inventory/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const body = z
      .object({
        itemName: z.string().min(1).optional(),
        quantity: z.coerce.number().positive().optional(),
        category: z.string().min(1).optional(),
        purchaseDate: z.string().optional().nullable(),
        expirationDate: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
      .parse(req.body);

    // Update fields individually if provided
    if (body.itemName !== undefined) {
      await sql`UPDATE user_inventory SET item_name = ${body.itemName} WHERE id = ${itemId} AND user_id = ${decoded.userId}`;
    }
    if (body.quantity !== undefined) {
      await sql`UPDATE user_inventory SET quantity = ${body.quantity} WHERE id = ${itemId} AND user_id = ${decoded.userId}`;
    }
    if (body.category !== undefined) {
      await sql`UPDATE user_inventory SET category = ${body.category} WHERE id = ${itemId} AND user_id = ${decoded.userId}`;
    }
    if (body.purchaseDate !== undefined) {
      await sql`UPDATE user_inventory SET purchase_date = ${body.purchaseDate || null} WHERE id = ${itemId} AND user_id = ${decoded.userId}`;
    }
    if (body.expirationDate !== undefined) {
      await sql`UPDATE user_inventory SET expiration_date = ${body.expirationDate || null} WHERE id = ${itemId} AND user_id = ${decoded.userId}`;
    }
    if (body.notes !== undefined) {
      await sql`UPDATE user_inventory SET notes = ${body.notes || null} WHERE id = ${itemId} AND user_id = ${decoded.userId}`;
    }

    // Always update the updated_at timestamp
    await sql`UPDATE user_inventory SET updated_at = NOW() WHERE id = ${itemId} AND user_id = ${decoded.userId}`;

    // Fetch the updated item
    const [updatedItem] = await sql`
      SELECT id, item_name, quantity, category, purchase_date, expiration_date, notes, created_at, updated_at
      FROM user_inventory
      WHERE id = ${itemId} AND user_id = ${decoded.userId}
    `;

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({
      message: "Item updated successfully",
      item: {
        id: updatedItem.id,
        itemName: updatedItem.item_name,
        quantity: Number(updatedItem.quantity),
        category: updatedItem.category,
        purchaseDate: updatedItem.purchase_date,
        expirationDate: updatedItem.expiration_date,
        notes: updatedItem.notes,
        createdAt: updatedItem.created_at,
        updatedAt: updatedItem.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message });
    }
    console.error("Update inventory item failed", error);
    res.status(500).json({ message: "Failed to update item" });
  }
});

app.delete("/api/user-inventory/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    await sql`
      DELETE FROM user_inventory 
      WHERE id = ${itemId} AND user_id = ${decoded.userId}
    `;

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete inventory item failed", error);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// Notifications Endpoint
app.get("/api/notifications", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    // Get expired items
    const expiredItems = await sql`
      SELECT id, item_name, expiration_date
      FROM user_inventory
      WHERE user_id = ${decoded.userId}
        AND expiration_date <= ${today.toISOString().split('T')[0]}
      ORDER BY expiration_date ASC
    `;

    // Get expiring soon items (within 2 days, but not yet expired)
    const expiringSoonItems = await sql`
      SELECT id, item_name, expiration_date
      FROM user_inventory
      WHERE user_id = ${decoded.userId}
        AND expiration_date > ${today.toISOString().split('T')[0]}
        AND expiration_date <= ${twoDaysFromNow.toISOString().split('T')[0]}
      ORDER BY expiration_date ASC
    `;

    const notifications = [];

    // Create expired notification
    if (expiredItems.length > 0) {
      notifications.push({
        id: `expired-${Date.now()}`,
        type: "expired",
        message: expiredItems.length === 1
          ? `${expiredItems[0].item_name} has expired`
          : `${expiredItems.length} items have expired`,
        items: expiredItems.map((item: any) => ({
          id: item.id,
          name: item.item_name,
          expirationDate: item.expiration_date,
        })),
        createdAt: new Date().toISOString(),
      });
    }

    // Create expiring soon notification
    if (expiringSoonItems.length > 0) {
      notifications.push({
        id: `expiring-${Date.now()}`,
        type: "expiring",
        message: expiringSoonItems.length === 1
          ? `${expiringSoonItems[0].item_name} is expiring soon`
          : `${expiringSoonItems.length} items are expiring soon`,
        items: expiringSoonItems.map((item: any) => ({
          id: item.id,
          name: item.item_name,
          expirationDate: item.expiration_date,
        })),
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications failed", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Waste to Asset AI Endpoint
app.post("/api/waste-to-asset", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!genAI) {
      return res.status(503).json({ message: "AI service not configured (Missing API Key)" });
    }

    const body = z.object({
      itemNames: z.array(z.string().min(1)).min(1),
    }).parse(req.body);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const itemList = body.itemNames.join(", ");
    const multipleItems = body.itemNames.length > 1;

    const prompt = multipleItems
      ? `I have the following wasted or overripe items: ${itemList}.

First, determine if these items can be combined together in a recipe or project. If they can be combined, generate ideas that use them together. If they cannot be combined, generate separate ideas.

Return your response as a JSON object with this exact structure:
{
  "canCombine": true or false,
  "recipeIdeas": [
    {
      "title": "Short catchy title (max 5 words)",
      "summary": "Brief one-sentence description (max 20 words)",
      "details": "Detailed step-by-step instructions (3-5 sentences)"
    },
    // ... 2 more recipe ideas (3 total)
  ],
  "nonRecipeIdeas": [
    {
      "title": "Short catchy title (max 5 words)",
      "summary": "Brief one-sentence description (max 20 words)",
      "details": "Detailed step-by-step instructions (3-5 sentences)"
    },
    // ... 2 more non-recipe ideas (3 total)
  ]
}

Generate exactly 3 recipe ideas (food/drink recipes) and 3 non-recipe ideas (gardening, DIY, composting, beauty treatments, etc.). Make them creative, practical, and safe.`
      : `I have some wasted or overripe ${body.itemNames[0]}.

Generate creative, practical, and safe ways to repurpose it.

Return your response as a JSON object with this exact structure:
{
  "canCombine": true,
  "recipeIdeas": [
    {
      "title": "Short catchy title (max 5 words)",
      "summary": "Brief one-sentence description (max 20 words)",
      "details": "Detailed step-by-step instructions (3-5 sentences)"
    },
    // ... 2 more recipe ideas (3 total)
  ],
  "nonRecipeIdeas": [
    {
      "title": "Short catchy title (max 5 words)",
      "summary": "Brief one-sentence description (max 20 words)",
      "details": "Detailed step-by-step instructions (3-5 sentences)"
    },
    // ... 2 more non-recipe ideas (3 total)
  ]
}

Generate exactly 3 recipe ideas (food/drink recipes) and 3 non-recipe ideas (gardening, DIY, composting, beauty treatments, etc.).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from the response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", text);
      // Fallback: return unparsed text
      return res.json({
        canCombine: true,
        recipeIdeas: [
          {
            title: "AI Suggestion",
            summary: "See details for ideas",
            details: text,
          },
          {
            title: "Try Again",
            summary: "Response format was unexpected",
            details: "Please try generating again for better results.",
          },
          {
            title: "Manual Recipe",
            summary: "Look up traditional recipes",
            details: "You can search online for recipes using these ingredients.",
          },
        ],
        nonRecipeIdeas: [
          {
            title: "Composting",
            summary: "Add to compost pile",
            details: "These items can be composted to enrich your garden soil.",
          },
          {
            title: "Plant Fertilizer",
            summary: "Create natural fertilizer",
            details: "Many food scraps can be turned into liquid fertilizer for plants.",
          },
          {
            title: "DIY Projects",
            summary: "Craft and beauty uses",
            details: "Search for DIY beauty treatments or craft projects using these materials.",
          },
        ],
      });
    }

    res.json(parsedData);
  } catch (error) {
    console.error("Waste to Asset AI failed. Error details:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: `AI Error: ${errorMessage}` });
  }
});

// =====================
// COMMUNITY ENDPOINTS
// =====================

// Get all community posts
app.get("/api/community/posts", async (req, res) => {
  try {
    const posts = await sql`
      SELECT 
        cp.*,
        u.name as author_name,
        u.avatar_url,
        COUNT(pc.id)::int as comment_count
      FROM community_posts cp
      INNER JOIN users u ON cp.user_id = u.id
      LEFT JOIN post_comments pc ON cp.id = pc.post_id
      GROUP BY cp.id, u.name, u.avatar_url
      ORDER BY cp.created_at DESC
    `;

    res.json({ posts });
  } catch (error) {
    console.error("Fetch community posts failed", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Create a new community post
app.post("/api/community/posts", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const body = z.object({
      postType: z.enum(["need", "donate"]),
      foodName: z.string().min(1),
      quantity: z.number().positive(),
      unit: z.string().optional(),
      targetDate: z.string(),
      details: z.string().optional(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().min(1),
    }).parse(req.body);

    const result = await sql`
      INSERT INTO community_posts (user_id, post_type, food_name, quantity, unit, target_date, details, latitude, longitude, address)
      VALUES (${decoded.userId}, ${body.postType}, ${body.foodName}, ${body.quantity}, ${body.unit || null}, ${body.targetDate}, ${body.details || null}, ${body.latitude}, ${body.longitude}, ${body.address})
      RETURNING *
    `;

    const post = result[0];

    // Fetch user info to include in response
    const users = await sql`SELECT name, avatar_url FROM users WHERE id = ${decoded.userId}`;
    const enrichedPost = {
      ...post,
      author_name: users[0]?.name,
      avatar_url: users[0]?.avatar_url,
      comment_count: 0,
    };

    res.status(201).json({ post: enrichedPost });
  } catch (error) {
    console.error("Create community post failed", error);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// Get single post with comments
app.get("/api/community/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const posts = await sql`
      SELECT 
        cp.*,
        u.name as author_name,
        u.avatar_url
      FROM community_posts cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ${postId}
    `;

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await sql`
      SELECT 
        pc.*,
        u.name as author_name,
        u.avatar_url
      FROM post_comments pc
      INNER JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ${postId}
      ORDER BY pc.created_at ASC
    `;

    res.json({ post: posts[0], comments });
  } catch (error) {
    console.error("Fetch post failed", error);
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Delete a community post
app.delete("/api/community/posts/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const postId = parseInt(req.params.id);

    // Check if post belongs to user
    const posts = await sql`
      SELECT * FROM community_posts WHERE id = ${postId} AND user_id = ${decoded.userId}
    `;

    if (posts.length === 0) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await sql`DELETE FROM community_posts WHERE id = ${postId}`;
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post failed", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

// Add comment to a post
app.post("/api/community/posts/:id/comments", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const postId = parseInt(req.params.id);

    const body = z.object({
      commentText: z.string().min(1),
    }).parse(req.body);

    const result = await sql`
      INSERT INTO post_comments (post_id, user_id, comment_text)
      VALUES (${postId}, ${decoded.userId}, ${body.commentText})
      RETURNING *
    `;

    const comment = result[0];

    // Get author info
    const users = await sql`SELECT name, avatar_url FROM users WHERE id = ${decoded.userId}`;
    const enrichedComment = {
      ...comment,
      author_name: users[0].name,
      avatar_url: users[0].avatar_url,
    };

    res.status(201).json({ comment: enrichedComment });
  } catch (error) {
    console.error("Add comment failed", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// Delete a comment
app.delete("/api/community/comments/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const commentId = parseInt(req.params.id);

    // Check if comment belongs to user
    const comments = await sql`
      SELECT * FROM post_comments WHERE id = ${commentId} AND user_id = ${decoded.userId}
    `;

    if (comments.length === 0) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await sql`DELETE FROM post_comments WHERE id = ${commentId}`;
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment failed", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});


// Chatbot Endpoint
app.post("/api/chatbot", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({ message: "AI service not configured" });
    }

    const body = z.object({
      message: z.string().min(1),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
      sessionContext: z.object({
        sessionStart: z.number().optional(),
        messageCount: z.number().optional(),
        sessionDuration: z.number().optional(),
      }).optional(),
    }).parse(req.body);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Try to get user context if authenticated (optional)
    let userContext = '';
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        // Fetch user inventory
        const inventoryItems = await sql`
          SELECT item_name, quantity, category, expiration_date, purchase_date
          FROM user_inventory
          WHERE user_id = ${decoded.userId}
          ORDER BY expiration_date ASC NULLS LAST
          LIMIT 20
        `;

        // Fetch recent usage logs for analytics
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const usageLogs = await sql`
          SELECT item_name, quantity, category, usage_date
          FROM food_usage_logs
          WHERE user_id = ${decoded.userId}
            AND usage_date >= ${fourWeeksAgo.toISOString().split('T')[0]}
          ORDER BY usage_date DESC
          LIMIT 30
        `;

        // Get user profile
        const userData = await sql`
          SELECT name, budget_preferences, location, dietary_needs
          FROM users
          WHERE id = ${decoded.userId}
        `;

        if (inventoryItems.length > 0 || usageLogs.length > 0 || userData.length > 0) {
          userContext = '\n\nUSER CONTEXT (use this to provide personalized advice):\n';
          
          if (userData.length > 0) {
            const user = userData[0];
            userContext += `User Profile:\n`;
            userContext += `- Name: ${user.name}\n`;
            if (user.budget_preferences) userContext += `- Budget Preference: ${user.budget_preferences}\n`;
            if (user.location) userContext += `- Location: ${user.location}\n`;
            if (user.dietary_needs) userContext += `- Dietary Needs: ${user.dietary_needs}\n`;
          }

          if (inventoryItems.length > 0) {
            userContext += `\nCurrent Inventory (${inventoryItems.length} items):\n`;
            const expiringSoon = inventoryItems.filter(item => {
              if (!item.expiration_date) return false;
              const expDate = new Date(item.expiration_date);
              const daysUntilExp = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return daysUntilExp <= 7 && daysUntilExp >= 0;
            });
            
            if (expiringSoon.length > 0) {
              userContext += `⚠️ Items expiring soon (within 7 days):\n`;
              expiringSoon.forEach(item => {
                const expDate = new Date(item.expiration_date);
                const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                userContext += `  - ${item.item_name} (${item.quantity} ${item.category}) - ${daysLeft} days left\n`;
              });
            }
            
            userContext += `All items: ${inventoryItems.map(item => `${item.item_name} (${item.quantity} ${item.category})`).join(', ')}\n`;
          }

          if (usageLogs.length > 0) {
            const categoryTotals: Record<string, number> = {};
            usageLogs.forEach(log => {
              categoryTotals[log.category] = (categoryTotals[log.category] || 0) + Number(log.quantity);
            });
            userContext += `\nRecent Consumption (last 4 weeks):\n`;
            Object.entries(categoryTotals).forEach(([cat, qty]) => {
              userContext += `  - ${cat}: ${qty.toFixed(1)} units\n`;
            });
          }
        }
      }
    } catch (authError) {
      // User not authenticated or error - continue without context
      // This is fine, chatbot works for both authenticated and non-authenticated users
    }

    // Build conversation history for context
    const historyContext = body.conversationHistory?.map(msg =>
      `${msg.role === 'user' ? 'User' : 'KhaddoKotha'}: ${msg.content}`
    ).join('\n') || '';

    // Build session context information
    let sessionInfo = '';
    if (body.sessionContext) {
      const { sessionStart, messageCount, sessionDuration } = body.sessionContext;
      sessionInfo = '\n\nSESSION CONTEXT:\n';
      if (sessionStart) {
        const sessionDate = new Date(sessionStart).toLocaleString();
        sessionInfo += `- Session started: ${sessionDate}\n`;
      }
      if (messageCount) {
        sessionInfo += `- Total messages in this session: ${messageCount}\n`;
      }
      if (sessionDuration) {
        const minutes = Math.floor(sessionDuration / (1000 * 60));
        sessionInfo += `- Session duration: ${minutes} minutes\n`;
      }
      sessionInfo += '- This is an ongoing conversation. Reference previous messages for context.\n';
    }

    const systemPrompt = `You are KhaddoKotha AI Assistant, an expert food management and sustainability advisor for a food waste reduction platform.

CORE CAPABILITIES - You excel at:

1. FOOD WASTE REDUCTION ADVICE:
   - Analyze user's inventory and consumption patterns to identify waste risks
   - Suggest meal planning strategies to use items before expiration
   - Provide storage tips to extend food shelf life
   - Recommend portion control and shopping strategies
   - Identify items expiring soon and suggest immediate use recipes
   - Calculate potential savings from waste reduction

2. NUTRITION BALANCING:
   - Analyze consumption patterns across food categories (Fruit, Vegetable, Dairy, Protein, Grain)
   - Identify nutritional gaps or imbalances in diet
   - Suggest specific foods to add for balanced nutrition
   - Recommend meal combinations for complete nutrition
   - Provide category-specific advice (e.g., "You're low on vegetables, try adding...")
   - Consider dietary restrictions and preferences

3. BUDGET MEAL PLANNING:
   - Create cost-effective meal plans based on user's inventory
   - Suggest budget-friendly recipes using available ingredients
   - Recommend shopping strategies to maximize value
   - Identify ways to reduce food costs through better planning
   - Suggest bulk cooking and meal prep ideas
   - Consider user's budget preference (low/medium/high)

4. CREATIVE IDEAS FOR TRANSFORMING LEFTOVERS:
   - Suggest creative recipes to repurpose specific leftover items
   - Provide ideas for transforming expired-soon items into new dishes
   - Recommend preservation methods (freezing, pickling, etc.)
   - Suggest combinations of leftover items for new meals
   - Provide step-by-step transformation ideas
   - Include tips for maintaining food safety

5. GUIDANCE ON LOCAL FOOD SHARING:
   - Explain how to use the platform's community features
   - Suggest what items are good for sharing/donating
   - Provide tips on food safety for sharing
   - Recommend local food banks or community organizations
   - Suggest ways to organize neighborhood food swaps
   - Explain benefits of food sharing for community

6. EXPLANATIONS OF ENVIRONMENTAL IMPACTS:
   - Explain carbon footprint of food waste
   - Calculate environmental impact of user's waste patterns
   - Discuss water usage in food production
   - Explain landfill methane emissions from food waste
   - Provide statistics on global food waste
   - Suggest ways to reduce environmental footprint
   - Connect individual actions to global impact

RESPONSE GUIDELINES:
- Be friendly, encouraging, and non-judgmental
- Use emojis sparingly for emphasis (🌱 ♻️ 💰 🥗)
- Keep responses concise (100-200 words) unless detailed instructions are needed
- Provide actionable, specific advice
- Reference user's actual inventory/consumption when available
- Use metric units (kg, grams) and local currency context when relevant
- Always prioritize food safety

PLATFORM FEATURES:
- Smart Inventory: Track food items with expiration dates
- Usage Analytics: Monitor consumption patterns and identify imbalances
- Food Preservative Guide: Learn preservation methods
- Waste to Asset: Get creative ideas to repurpose food
- Community: Share and donate food
- Daily Tracker: Log food usage
- Diet Planner: Plan balanced meals

${userContext}

${sessionInfo}

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}User: ${body.message}
KhaddoKotha:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      reply: "I'm having trouble connecting right now. Please try again in a moment!"
    });
  }
});



// Diet Planner Endpoint
app.post("/api/diet-planner/generate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!genAI) {
      return res.status(503).json({ message: "AI service not configured (Missing API Key)" });
    }

    const body = z.object({
      budget: z.number().positive(),
      preference: z.enum(["Veg", "Non-Veg", "Balanced"]),
    }).parse(req.body);

    // Fetch User Inventory (Home)
    const userInventory = await sql`
      SELECT item_name, category, quantity, expiration_date
      FROM user_inventory
      WHERE user_id = ${decoded.userId} AND quantity > 0
    `;

    // Fetch General Store Inventory
    const storeInventory = await sql`
      SELECT item_name, category, cost_per_unit, expiration_days
      FROM food_inventory
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a smart diet planner. Create a one-person daily meal plan (Breakfast, Lunch, Dinner) based on the following constraints:

      **User Inputs:**
      - Daily Budget: $${body.budget}
      - Meal Preference: ${body.preference}

      **Inventories:**
      1. **Home Inventory** (Cost: $0, Prioritize these to reduce waste):
         ${JSON.stringify(userInventory)}
      2. **General Store Inventory** (Cost: specified per unit, use to fill gaps):
         ${JSON.stringify(storeInventory)}

      **Rules:**
      1. **Categorize Foods:** Ensure a balance of Carb, Protein, Vegetable, Fruit/Dairy/Extras.
      2. **Prioritize Home Items:** Use available home items first.
      3. **Fill Gaps:** Buy cheapest suitable items from store inventory if needed.
      4. **Budget:** Total cost of STORE items must be <= $${body.budget}.
      5. **Preference:** 
         - Veg: No meat/fish/egg.
         - Non-Veg: Allow meat/egg/fish.
         - Balanced: Mix freely.
      7. **Nutrition Analysis:** Calculate approximate total nutrition (Calories, Protein, Carbs, Fats, Fiber) for the entire day's plan. Compare these with standard daily recommendations for an average adult (approx. 2000kcal).

      **Output Format (JSON only):**
      {
        "meals": {
          "breakfast": [{ "item": "Name", "source": "Home" | "Store", "cost": 0.00 }],
          "lunch": [{ "item": "Name", "source": "Home" | "Store", "cost": 0.00 }],
          "dinner": [{ "item": "Name", "source": "Home" | "Store", "cost": 0.00 }]
        },
        "totalCost": 0.00,
        "homeItemsUsed": ["Item1", "Item2"],
        "storeItemsUsed": ["Item3", "Item4"],
        "sustainabilityImpact": "Brief text about money saved or waste prevented",
        "expiringItemsUsed": ["Item1"],
        "nutritionAnalysis": {
          "calories": { "provided": 0, "recommended": 2000, "unit": "kcal" },
          "protein": { "provided": 0, "recommended": 50, "unit": "g" },
          "carbs": { "provided": 0, "recommended": 275, "unit": "g" },
          "fats": { "provided": 0, "recommended": 78, "unit": "g" },
          "fiber": { "provided": 0, "recommended": 28, "unit": "g" }
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const dietPlan = JSON.parse(cleanedText);

    res.json(dietPlan);

  } catch (error) {
    console.error("Diet planner generation failed", error);
    res.status(500).json({ message: "Failed to generate diet plan" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`API ready on http://localhost:${config.PORT}`);
  console.log(`API also accessible on your network IP at port ${config.PORT}`);
});

