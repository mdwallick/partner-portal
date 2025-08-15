#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Add it to .env.local or your environment.');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Ensure helpers exist
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
  await sql`CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, executed_at timestamptz NOT NULL DEFAULT now());`;

  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found; nothing to do.');
    process.exit(0);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await sql`SELECT 1 FROM _migrations WHERE name = ${file} LIMIT 1;`;
    if (rows.length) {
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }
    const fullPath = path.join(migrationsDir, file);
    const statement = fs.readFileSync(fullPath, 'utf8');
    console.log(`Applying migration: ${file}`);
    await sql(statement);
    await sql`INSERT INTO _migrations (name) VALUES (${file});`;
    console.log(`Applied migration: ${file}`);
  }

  console.log('Migrations complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

