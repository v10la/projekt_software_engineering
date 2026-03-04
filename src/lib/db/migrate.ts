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

  CREATE TABLE IF NOT EXISTS gift_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_id INTEGER NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gift_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_id INTEGER NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL
  );

  -- Seed default occasions
  INSERT OR IGNORE INTO occasions (id, name, is_default) VALUES (1, 'Geburtstag', 1);
  INSERT OR IGNORE INTO occasions (id, name, is_default) VALUES (2, 'Weihnachten', 1);
`);

// Migrate existing link and image_path data into the new tables
const giftsWithLinks = sqlite
  .prepare("SELECT id, link FROM gifts WHERE link IS NOT NULL AND link != ''")
  .all() as { id: number; link: string }[];

for (const g of giftsWithLinks) {
  const existing = sqlite
    .prepare("SELECT id FROM gift_links WHERE gift_id = ? AND url = ?")
    .get(g.id, g.link);
  if (!existing) {
    sqlite
      .prepare("INSERT INTO gift_links (gift_id, url) VALUES (?, ?)")
      .run(g.id, g.link);
  }
}

const giftsWithImages = sqlite
  .prepare("SELECT id, image_path FROM gifts WHERE image_path IS NOT NULL AND image_path != ''")
  .all() as { id: number; image_path: string }[];

for (const g of giftsWithImages) {
  const existing = sqlite
    .prepare("SELECT id FROM gift_images WHERE gift_id = ? AND image_path = ?")
    .get(g.id, g.image_path);
  if (!existing) {
    sqlite
      .prepare("INSERT INTO gift_images (gift_id, image_path) VALUES (?, ?)")
      .run(g.id, g.image_path);
  }
}

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

// Add user_id columns for per-user data separation
function columnExists(table: string, column: string): boolean {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

if (!columnExists("persons", "user_id")) {
  sqlite.exec("ALTER TABLE persons ADD COLUMN user_id INTEGER");
  const admin = sqlite.prepare("SELECT id FROM users LIMIT 1").get() as { id: number } | undefined;
  if (admin) {
    sqlite.prepare("UPDATE persons SET user_id = ? WHERE user_id IS NULL").run(admin.id);
  }
  console.log("Added user_id column to persons table.");
}

if (!columnExists("occasions", "user_id")) {
  sqlite.exec("ALTER TABLE occasions ADD COLUMN user_id INTEGER");
  const admin = sqlite.prepare("SELECT id FROM users LIMIT 1").get() as { id: number } | undefined;
  if (admin) {
    sqlite.prepare("UPDATE occasions SET user_id = ? WHERE is_default = 0 AND user_id IS NULL").run(admin.id);
  }
  console.log("Added user_id column to occasions table.");
}

sqlite.close();
console.log("Database migrated and seeded successfully!");
