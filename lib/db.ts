// src/lib/db.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

function resolveDbPath() {
  const envPath = process.env.DB_PATH?.trim();
  if (envPath) return envPath;

  const botDb = path.join(process.cwd(), "VZALE_BOT", "tournament.db");
  if (fs.existsSync(botDb)) return botDb;

  // запасной вариант — пустая база в корне проекта, если бот ещё не положил свою
  return path.join(process.cwd(), "tournament.db");
}

function initDatabase() {
  const dbPath = resolveDbPath();

  if (!fs.existsSync(dbPath)) {
    console.warn("[DB] database file not found, will create new one at:", dbPath);
  } else {
    console.log("[DB] using database file:", dbPath);
  }

  const instance = new Database(dbPath);

  // На всякий случай создаём таблицу, если её ещё нет
  instance.exec(`
    CREATE TABLE IF NOT EXISTS web_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER NOT NULL UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return instance;
}

export function getDb() {
  if (!db) {
    db = initDatabase();
  }
  return db;
}
