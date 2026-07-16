#!/usr/bin/env node
/**
 * run-seed.js
 * Runs the products.sql seed against the configured PostgreSQL database.
 *
 * Usage:  npm run seed
 *         node src/db/seeds/run-seed.js
 */
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅  Connected to PostgreSQL');

  const sqlPath = path.join(__dirname, 'products.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await client.query(sql);
  console.log('✅  Seed applied — 130 productos insertados (SKU duplicados ignorados)');

  // Quick count
  const { rows } = await client.query(
    'SELECT c.name, COUNT(p.id) AS total FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id, c.name ORDER BY c.id'
  );
  console.log('\n📦  Productos por categoría:');
  rows.forEach((r) => console.log(`   ${r.name}: ${r.total}`));

  await client.end();
  console.log('\n🎉  Seed completado.');
}

main().catch((err) => {
  console.error('❌  Seed falló:', err.message);
  process.exit(1);
});
