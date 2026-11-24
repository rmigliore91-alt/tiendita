const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  // Neon (free) suspende la base tras unos minutos sin uso y corta las
  // conexiones inactivas; cerrarlas antes evita usar sockets muertos.
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
});

// Un error en una conexión inactiva (p. ej. Neon la cerró) no debe tumbar
// el servidor: el pool la descarta y abre una nueva en la próxima consulta.
pool.on('error', (err) => {
  console.error('Conexión inactiva de PostgreSQL cerrada:', err.message);
});

module.exports = pool;
