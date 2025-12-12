import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import {
  getAllTexts,
  addText,
  getCodeRole,
  getCodeRecord,
  generateCode,
  revokeCode,
  updateCodeLabel,
  updateTextStatus,
  deleteCode,
  deleteText,
  updateText,
  renameVocabularyItem,
  deleteVocabularyItem,
  addVocabularyItem
} from "./dataStore.js";
import {
  authenticateToken,
  isAdmin,
  generateToken,
  ADMIN_CODES,
  USER_CODES
} from "./authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://mt-pt.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
// Auth Routes
app.post("/auth/login", (req, res) => {
  const code = (req.body.code || "").trim();
  console.log("Login attempt with code:", code);

  let role = null;
  if (ADMIN_CODES.includes(code)) role = "admin";
  else if (USER_CODES.includes(code)) role = "user";

  if (!role) role = getCodeRole(code);

  console.log("Determined role:", role);

  if (role) {
    const token = generateToken({ role });
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
    return res.json({ role });
  }
  return res.status(401).json({ error: "Invalid code" });
});

app.get("/auth/me", authenticateToken, (req, res) => {
  res.json({ role: req.user.role });
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.post("/auth/generate", authenticateToken, isAdmin, async (req, res) => {
  const { role, label } = req.body;
  if (!['mod', 'user'].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const createdBy = req.user.role === 'admin' ? 'admin' : 'system';

  try {
    const codeRecord = await generateCode(role, label || "", createdBy);
    res.json(codeRecord);
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: "Failed to generate code" });
  }
});

app.get("/admin/codes", authenticateToken, isAdmin, async (req, res) => {
  try {
    const allCodes = (await getAllTexts()).codes || [];
    const activeCodes = allCodes.filter(c => c.active !== false);
    res.json(activeCodes);
  } catch (error) {
    console.error('Error getting codes:', error);
    res.status(500).json({ error: "Failed to get codes" });
  }
});

// Revoke code by ID
app.delete("/admin/codes/:id", authenticateToken, isAdmin, (req, res) => {
  const revoked = revokeCode(req.params.id);
  if (revoked) res.json(revoked);
  else res.status(404).json({ error: "Code not found" });
});

// Update code label
app.put("/admin/codes/:id/label", authenticateToken, isAdmin, (req, res) => {
  const { label } = req.body;
  const updated = updateCodeLabel(req.params.id, label);
  if (updated) res.json(updated);
  else res.status(404).json({ error: "Code not found" });
});

// Vocabulary Routes
app.get("/vocabulary", authenticateToken, (req, res) => {
  res.json(getAllTexts().vocabulary || { tags: [], playlists: [] });
});

app.post("/vocabulary/:type", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mod') return res.status(403).json({ error: "Forbidden" });
  const { type } = req.params;
  const { value } = req.body;
  if (!['tags', 'playlists'].includes(type)) return res.status(400).json({ error: "Invalid type" });

  // Import dynamically to avoid circular dependency issues if any, or just to fix the syntax error context
  // const dataStore = await import("./dataStore.js");
  const result = addVocabularyItem(type, value);
  res.json(result);
});

app.put("/vocabulary/:type", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mod') return res.status(403).json({ error: "Forbidden" });
  const { type } = req.params;
  const { oldVal, newVal } = req.body;
  if (!['tags', 'playlists'].includes(type)) return res.status(400).json({ error: "Invalid type" });

  // const dataStore = await import("./dataStore.js");
  const result = renameVocabularyItem(type, oldVal, newVal);
  res.json(result);
});

app.delete("/vocabulary/:type", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mod') return res.status(403).json({ error: "Forbidden" });
  const { type } = req.params;
  const { value } = req.body;
  if (!['tags', 'playlists'].includes(type)) return res.status(400).json({ error: "Invalid type" });

  // const dataStore = await import("./dataStore.js");
  const result = deleteVocabularyItem(type, value);
  res.json(result);
});
app.get("/texts", authenticateToken, async (req, res) => {
  try {
    const allData = await getAllTexts();
    const texts = allData.texts || [];
    if (req.user.role === 'admin') {
      res.json(texts);
    } else {
      res.json(texts.filter(t => t.status === 'active'));
    }
  } catch (error) {
    console.error('Error getting texts:', error);
    res.status(500).json({ error: "Failed to get texts" });
  }
});
app.post("/texts", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mod') {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { primary, translations, tags, playlists } = req.body;
  if (!primary) {
    return res.status(400).json({ error: "Primary text is required" });
  }

  const safeTranslations = translations || {};
  const status = req.user.role === 'admin' ? 'active' : 'pending';
  
  try {
    const newItem = await addText({ primary, translations: safeTranslations, tags, playlists }, status);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding text:', error);
    res.status(500).json({ error: "Failed to create text" });
  }
});
  // Expect { primary, translations: {}, tags: [], playlists: [] }
  const { primary, translations, tags, playlists } = req.body;
  if (!primary) {
    return res.status(400).json({ error: "Primary text is required" });
  }

  // Ensure translations is an object
  const safeTranslations = translations || {};

  const status = req.user.role === 'admin' ? 'active' : 'pending';
  const newItem = addText({ primary, translations: safeTranslations, tags, playlists }, status);
  res.status(201).json(newItem);
});

app.put("/texts/:id/approve", authenticateToken, isAdmin, (req, res) => {
  const updated = updateTextStatus(req.params.id, 'active');
  if (updated) res.json(updated);
  else res.status(404).json({ error: "Text not found" });
});

app.put("/texts/:id", authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'mod') {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates = req.body;
  const updated = updateText(req.params.id, updates);
  if (updated) res.json(updated);
  else res.status(404).json({ error: "Text not found" });
});

app.delete("/texts/:id", authenticateToken, isAdmin, (req, res) => {
  if (deleteText(req.params.id)) res.json({ message: "Text deleted" });
  else res.status(404).json({ error: "Text not found" });
});

// For local development
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
