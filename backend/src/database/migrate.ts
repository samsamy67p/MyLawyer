import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPool, withTransaction } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('--- Starting PostgreSQL Migrations ---');

  // 1. Create migrations tracking table if not exists
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 2. Discover migration files
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log(`No migrations directory found at: ${migrationsDir}`);
    await dbPool.end();
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No SQL migration files found.');
    await dbPool.end();
    return;
  }

  // 3. Fetch already applied migrations
  const { rows: appliedRows } = await dbPool.query('SELECT name FROM schema_migrations');
  const appliedSet = new Set(appliedRows.map(r => r.name));

  let appliedCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[SKIPPED] ${file} (already applied)`);
      continue;
    }

    console.log(`[APPLYING] ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });

    console.log(`[SUCCESS] Applied ${file}`);
    appliedCount++;
  }

  console.log(`--- Migrations finished. Total newly applied: ${appliedCount} ---`);
  await dbPool.end();
}

runMigrations().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});

