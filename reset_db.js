const fs = require("fs");
const path = require("path");

// Delete the old SQLite fallback so it gets re-seeded with new data
const dbPath = path.join(__dirname, "backend", "nodoos_fallback.db");
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("✅ Deleted old fallback DB — will re-seed on next server start.");
} else {
  console.log("ℹ️  No existing fallback DB found — fresh start.");
}
