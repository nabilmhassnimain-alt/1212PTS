import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
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
  addVocabularyItem,
  getAllCodes,
  getVocabulary
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
    "https://1212-pts-gleo.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Auth Routes
app.post("/auth/login", async (req, res) => {
  try {
    const code = (req.body.code || "").trim();
    console.log("Login attempt with code:", code);

    let role = null;
    if (ADMIN_CODES.includes(code)) role = "admin";
    else if (USER_CODES.includes(code)) role = "user";

    if (!role) role = await getCodeRole(code);

    console.log("Determined role:", role);

    if (role) {
      const token = generateToken({ role });
      res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
      return res.json({ role });
    }
    return res.status(401).json({ error: "Invalid code" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/auth/me", authenticateToken, (req, res) => {
  res.json({ role: req.user.role });
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.post("/auth/generate", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role, label } = req.body;
    if (!['mod', 'user'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const createdBy = req.user.role === 'admin' ? 'admin' : 'system';
    const codeRecord = await generateCode(role, label || "", createdBy);
    res.json(codeRecord);
  } catch (error) {
    console.error("Generate code error:", error);
    return res.status(500).json({ error: "Failed to generate code" });
  }
});

app.get("/admin/codes", authenticateToken, isAdmin, async (req, res) => {
  try {
    const activeCodes = await getAllCodes(false);
    res.json(activeCodes);
  } catch (error) {
    console.error("Get codes error:", error);
    return res.status(500).json({ error: "Failed to retrieve codes" });
  }
});

// Revoke code by ID
app.delete("/admin/codes/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const revoked = await revokeCode(req.params.id);
    if (revoked) res.json(revoked);
    else res.status(404).json({ error: "Code not found" });
  } catch (error) {
    console.error("Revoke code error:", error);
    return res.status(500).json({ error: "Failed to revoke code" });
  }
});

// Update code label
app.put("/admin/codes/:id/label", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { label } = req.body;
    const updated = await updateCodeLabel(req.params.id, label);
    if (updated) res.json(updated);
    else res.status(404).json({ error: "Code not found" });
  } catch (error) {
    console.error("Update label error:", error);
    return res.status(500).json({ error: "Failed to update label" });
  }
});

// Vocabulary Routes
app.get("/vocabulary", authenticateToken, async (req, res) => {
  try {
    const vocab = await getVocabulary();
    res.json(vocab);
  } catch (error) {
    console.error("Get vocabulary error:", error);
    return res.status(500).json({ error: "Failed to retrieve vocabulary" });
  }
});

app.post("/vocabulary/:type", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'mod') {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { type } = req.params;
    const { value } = req.body;
    if (!['tags', 'playlists'].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const result = await addVocabularyItem(type, value);
    res.json(result);
  } catch (error) {
    console.error("Add vocabulary error:", error);
    return res.status(500).json({ error: "Failed to add vocabulary item" });
  }
});

app.put("/vocabulary/:type", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'mod') {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { type } = req.params;
    const { oldVal, newVal } = req.body;
    if (!['tags', 'playlists'].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const result = await renameVocabularyItem(type, oldVal, newVal);
    res.json(result);
  } catch (error) {
    console.error("Rename vocabulary error:", error);
    return res.status(500).json({ error: "Failed to rename vocabulary item" });
  }
});

app.delete("/vocabulary/:type", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'mod') {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { type } = req.params;
    const { value } = req.body;
    if (!['tags', 'playlists'].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const result = await deleteVocabularyItem(type, value);
    res.json(result);
  } catch (error) {
    console.error("Delete vocabulary error:", error);
    return res.status(500).json({ error: "Failed to delete vocabulary item" });
  }
});

// Texts Routes
app.get("/texts", authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const texts = await getAllTexts();
      res.json(texts);
    } else {
      const texts = await getAllTexts('active');
      res.json(texts);
    }
  } catch (error) {
    console.error("Get texts error:", error);
    return res.status(500).json({ error: "Failed to retrieve texts" });
  }
});

app.post("/texts", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'mod') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { primary, translations, tags, playlists } = req.body;
    if (!primary) {
      return res.status(400).json({ error: "Primary text is required" });
    }

    const safeTranslations = translations || {};
    const status = req.user.role === 'admin' ? 'active' : 'pending';
    const newItem = await addText(
      { primary, translations: safeTranslations, tags, playlists },
      status
    );
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Add text error:", error);
    return res.status(500).json({ error: "Failed to create text" });
  }
});

app.put("/texts/:id/approve", authenticateToken, isAdmin, async (req, res) => {
  try {
    const updated = await updateTextStatus(req.params.id, 'active');
    if (updated) res.json(updated);
    else res.status(404).json({ error: "Text not found" });
  } catch (error) {
    console.error("Approve text error:", error);
    return res.status(500).json({ error: "Failed to approve text" });
  }
});

app.put("/texts/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'mod') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = req.body;
    const updated = await updateText(req.params.id, updates);
    if (updated) res.json(updated);
    else res.status(404).json({ error: "Text not found" });
  } catch (error) {
    console.error("Update text error:", error);
    return res.status(500).json({ error: "Failed to update text" });
  }
});

app.delete("/texts/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const deleted = await deleteText(req.params.id);
    if (deleted) res.json({ message: "Text deleted" });
    else res.status(404).json({ error: "Text not found" });
  } catch (error) {
    console.error("Delete text error:", error);
    return res.status(500).json({ error: "Failed to delete text" });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
