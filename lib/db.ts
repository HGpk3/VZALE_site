// src/lib/db.ts
import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function initDatabase() {
  // 👉 ОБЯЗАТЕЛЬНО проверь путь, чтобы он совпадал с тем,
  // где реально лежит tournament.db у бота
  const dbPath =
    process.env.DB_PATH ||
    "C:/Users/User/Desktop/Site_VZALE/vzale-site/VZALE_BOT/tournament.db"
  console.log("[DB] using database file:", dbPath);

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
