// scripts/run-migrations.mjs
// 通过 pg 库直接连接 Supabase PostgreSQL 执行 SQL 迁移
import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase 数据库连接（使用 Transaction pooler）
const connectionString = `postgresql://postgres.inljmgfwpgtltpqqnfvm:${process.env.DB_PASSWORD || "请设置DB_PASSWORD环境变量"}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

const migrations = [
  "00001_create_mock_tables.sql",
  "00002_create_assistant_tables.sql",
  "00003_create_rls_policies.sql",
];

async function runMigrations() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    for (const file of migrations) {
      const path = join(__dirname, "..", "supabase", "migrations", file);
      const sql = readFileSync(path, "utf-8");

      console.log(`📦 Running migration: ${file}...`);

      try {
        await client.query(sql);
        console.log(`✅ Migration ${file} complete\n`);
      } catch (err) {
        console.error(`❌ Migration ${file} failed: ${err.message}\n`);
        // Continue with next migration
      }
    }
  } finally {
    await client.end();
    console.log("\n🔒 Connection closed");
  }
}

runMigrations().catch(console.error);
