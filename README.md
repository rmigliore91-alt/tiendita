# Taita Stock — Sistema de Gestión de Inventario

> Stock management system for [tienda.taita.com.py](https://tienda.taita.com.py)

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 16

---

## Quick Start (local development)

### 1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

pgAdmin will be available at http://localhost:5050 (admin@taita.com.py / taita)

### 2. Backend

```bash
cd backend
cp .env.example .env   # already done — edit if needed
npm install
npm run setup          # run migration + seed admin user
npm run dev            # starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

---

## Default Credentials

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@taita.com.py     |
| Password | Admin1234              |
| Role     | Administrador (admin)  |

> ⚠️ Change the password after first login via the Usuarios panel.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable        | Default                                          |
|-----------------|--------------------------------------------------|
| PORT            | 3001                                             |
| DATABASE_URL    | postgresql://taita:taita@localhost:5432/tiendita |
| JWT_SECRET      | (change in production!)                          |
| JWT_EXPIRES_IN  | 8h                                               |
| BCRYPT_ROUNDS   | 10                                               |
| ADMIN_PASSWORD  | Admin1234 (used by `npm run setup`)              |

### Frontend (`frontend/.env`)
| Variable      | Default                   |
|---------------|---------------------------|
| VITE_API_URL  | /api (proxied via Vite)   |

---

## API Reference

| Method | Path                          | Auth     | Description               |
|--------|-------------------------------|----------|---------------------------|
| POST   | /api/auth/login               | Public   | Login                     |
| GET    | /api/auth/me                  | Any      | Current user              |
| GET    | /api/categories               | Any      | List categories           |
| GET    | /api/products                 | Any      | List products + filters   |
| POST   | /api/products                 | Admin    | Create product            |
| PUT    | /api/products/:id             | Admin    | Update product            |
| PATCH  | /api/products/:id/deactivate  | Admin    | Deactivate product        |
| GET    | /api/products/dashboard-stats | Any      | Dashboard KPIs            |
| GET    | /api/movements                | Any      | List movements + filters  |
| POST   | /api/movements                | Any      | Record movement           |
| GET    | /api/movements/export         | Any      | Export CSV                |
| GET    | /api/movements/recent         | Any      | Last 10 movements         |
| GET    | /api/users                    | Admin    | List users                |
| POST   | /api/users                    | Admin    | Create user               |
| PUT    | /api/users/:id                | Admin    | Update user               |
| PATCH  | /api/users/:id/deactivate     | Admin    | Deactivate user           |

---

## Project Structure

```
La tiendita/
├── backend/
│   ├── migrations/001_init.sql
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/{auth,errorHandler}.js
│   │   ├── controllers/
│   │   └── routes/
│   ├── setup.js
│   └── package.json
├── frontend/
│   └── src/
│       ├── api/client.js
│       ├── context/AuthContext.jsx
│       ├── components/{layout,ui,dashboard}/
│       ├── pages/
│       └── utils/formatters.js
└── docker-compose.yml
```

---

## Roles

| Feature                        | Admin | Operator |
|--------------------------------|:-----:|:--------:|
| Dashboard                      | ✅    | ✅       |
| Ver productos                  | ✅    | ✅       |
| Crear/editar/desactivar producto| ✅   | ❌       |
| Registrar movimiento           | ✅    | ✅       |
| Ver historial                  | ✅    | ✅       |
| Exportar CSV                   | ✅    | ✅       |
| Gestionar usuarios             | ✅    | ❌       |
