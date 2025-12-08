// src/lib/auth.ts
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import type { SerializeOptions } from "cookie";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "replace-this-secret";
const JWT_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function signToken(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION_SECONDS });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function createAuthCookie(token: string) {
  const cookieOptions: SerializeOptions = {
    httpOnly: true,
    maxAge: JWT_EXPIRATION_SECONDS,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return cookie.serialize("token", token, cookieOptions);
}

export function clearAuthCookie() {
  return cookie.serialize("token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function requireAuth(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const parsed = cookie.parse(cookieHeader);
  const token = parsed.token;
  if (!token) return null;
  return verifyToken(token);
}
