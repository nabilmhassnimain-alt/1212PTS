import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

console.log("Loading authMiddleware...");
console.log("ADMIN_CODES raw:", process.env.ADMIN_CODES);
console.log("USER_CODES raw:", process.env.USER_CODES);

export const ADMIN_CODES = (process.env.ADMIN_CODES || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

export const USER_CODES = (process.env.USER_CODES || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

console.log("ADMIN_CODES parsed:", ADMIN_CODES);
console.log("USER_CODES parsed:", USER_CODES);

export function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
}

export function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Matched with server.js 'token'
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { role: 'admin' | 'user' | 'mod' }
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

export function isAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
}
