import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "geschenke.db");

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birthday TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS occasions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    occasion_id INTEGER REFERENCES occasions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    link TEXT DEFAULT '',
    image_path TEXT DEFAULT '',
    gift_date TEXT,
    is_idea INTEGER NOT NULL DEFAULT 1,
    is_purchased INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_id INTEGER NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_done INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS share_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Seed default occasions
  INSERT OR IGNORE INTO occasions (id, name, is_default) VALUES (1, 'Geburtstag', 1);
  INSERT OR IGNORE INTO occasions (id, name, is_default) VALUES (2, 'Weihnachten', 1);
`);

const existingAdmin = sqlite
  .prepare("SELECT id FROM users WHERE email = ?")
  .get("admin@example.com");

if (!existingAdmin) {
  const hash = bcrypt.hashSync("admin123", 10);
  sqlite
    .prepare(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
    )
    .run("Admin", "admin@example.com", hash, "admin");
  console.log(
    'Default admin user created (admin@example.com / admin123). Change the password after first login!'
  );
}

sqlite.close();
console.log("Database migrated and seeded successfully!");
