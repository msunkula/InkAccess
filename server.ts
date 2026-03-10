/**
 * © 2026 Mahesh Sunkula
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize database
  const db = new Database("feedback.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rating INTEGER,
      comment TEXT,
      timestamp TEXT
    )
  `);

  app.use(express.json());

  // API routes
  app.post("/api/feedback", (req, res) => {
    const { rating, comment, timestamp } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO feedback (rating, comment, timestamp) VALUES (?, ?, ?)");
      stmt.run(rating, comment, timestamp);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  app.get("/api/feedback", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM feedback ORDER BY id DESC");
      const feedback = stmt.all();
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
