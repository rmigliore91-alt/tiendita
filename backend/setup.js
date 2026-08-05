#!/usr/bin/env node
/**
 * setup.js — Startup migration runner + admin seed
 *
 * - Crea la tabla _migrations si no existe para registrar qué scripts ya se aplicaron.
 * - Lee todos los archivos .sql de /migrations en orden alfabético.
 * - Solo aplica los que aún no fueron registrados (idempotente en cada deploy).
 * - Hace upsert del usuario admin con contraseña hasheada.
 *
 * Usage:  node setup.js
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅  Connected to PostgreSQL');

  // ------------------------------------------------------------------
  // 1. Crear tabla de control de migraciones si no existe
  // ------------------------------------------------------------------
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ------------------------------------------------------------------
  // 2. Leer migraciones ya aplicadas
  // ------------------------------------------------------------------
  const { rows: applied } = await client.query('SELECT filename FROM _migrations');
  const appliedSet = new Set(applied.map(r => r.filename));

  // ------------------------------------------------------------------
  // 3. Leer archivos .sql de la carpeta migrations en orden
  // ------------------------------------------------------------------
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // orden alfabético = numérico por convención NNN_nombre.sql

  let newCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`⏭️   Ya aplicada: ${file}`);
      continue;
    }

    console.log(`⚙️   Aplicando: ${file} …`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO _migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`✅  Aplicada:  ${file}`);
      newCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Error en migración ${file}: ${err.message}`);
    }
  }

  if (newCount === 0) {
    console.log('ℹ️   Base de datos al día — ninguna migración nueva.');
  } else {
    console.log(`✅  ${newCount} migración(es) aplicada(s).`);
  }

  // ------------------------------------------------------------------
  // 4. Upsert del usuario admin con contraseña hasheada
  // ------------------------------------------------------------------
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
  console.log('🎉  Setup complete. Starting server…');
}

main().catch((err) => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
