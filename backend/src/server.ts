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
      itemName: z.string().min(1),
    }).parse(req.body);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `I have some wasted or overripe ${body.itemName}. Give me 3 creative, practical, and safe ways to repurpose it (e.g., recipes, gardening, DIY). Keep it concise. Format as a simple list.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ suggestions: text });
  } catch (error) {
    console.error("Waste to Asset AI failed. Error details:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: `AI Error: ${errorMessage}` });
  }
});


app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`API ready on http://localhost:${config.PORT}`);
  console.log(`API also accessible on your network IP at port ${config.PORT}`);
});

