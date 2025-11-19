import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || "your-secret-key-change-in-production";
}

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; email: string } {
  return jwt.verify(token, getJwtSecret()) as { userId: number; email: string };
}

