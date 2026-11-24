#!/usr/bin/env bash
# ============================================================
# migrar-db.sh – Copia la base de Railway a Neon
# Uso:
#   RAILWAY_URL='postgresql://...' NEON_URL='postgresql://...?sslmode=require' ./migrar-db.sh
# ============================================================
set -euo pipefail

: "${RAILWAY_URL:?Falta RAILWAY_URL (DATABASE_URL pública de Railway)}"
: "${NEON_URL:?Falta NEON_URL (connection string de Neon)}"

BACKUP="backup-railway-$(date +%Y%m%d-%H%M%S).sql"

echo "📦  Exportando base de Railway → $BACKUP"
pg_dump "$RAILWAY_URL" --no-owner --no-privileges --format=plain > "$BACKUP"
echo "    $(wc -l < "$BACKUP") líneas exportadas"

echo "📥  Restaurando en Neon..."
psql "$NEON_URL" --set ON_ERROR_STOP=1 --single-transaction --quiet -f "$BACKUP"

echo "🔎  Verificando cantidad de filas por tabla:"
psql "$NEON_URL" -c "ANALYZE;" -c "SELECT relname AS tabla, n_live_tup AS filas FROM pg_stat_user_tables ORDER BY relname;"

echo "✅  Listo. Guardá $BACKUP como respaldo (no lo subas a git)."
