#!/usr/bin/env node
/**
 * setup.js — One-time setup script
 * Runs the SQL migration and seeds the default admin user
 * with a freshly hashed password.
 *
 * Usage:  node setup.js
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅  Connected to PostgreSQL');

  // Run migration SQL (skip user seed — we do it manually below)
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001_init.sql'), 'utf8');
  await client.query(sql);
  console.log('✅  Migration applied');

  // Upsert admin with freshly hashed password
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
  const hash = await bcrypt.hash(adminPassword, 10);

  await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
    ['Administrador', 'admin@taita.com.py', hash, 'admin']
  );
  console.log(`✅  Admin user ready — email: admin@taita.com.py  password: ${adminPassword}`);

  await client.end();
  console.log('🎉  Setup complete. You can now start the backend: npm run dev');
}

main().catch((err) => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
