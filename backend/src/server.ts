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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    }).parse(req.body);

    const result = await sql`
      INSERT INTO community_posts (user_id, post_type, food_name, quantity, unit, target_date, details)
      VALUES (${decoded.userId}, ${body.postType}, ${body.foodName}, ${body.quantity}, ${body.unit || null}, ${body.targetDate}, ${body.details || null})
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

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`API ready on http://localhost:${config.PORT}`);
  console.log(`API also accessible on your network IP at port ${config.PORT}`);
});

