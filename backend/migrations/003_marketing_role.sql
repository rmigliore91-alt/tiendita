-- ============================================================
-- 003_marketing_role.sql  –  Add 'marketing' role
-- ============================================================

-- Drop old constraint and add new one with marketing
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'operator', 'marketing'));

-- Create the marketing user (password: Marketing1234, bcrypt rounds=10)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Agente Marketing',
  'marketing@taita.com.py',
  '$2a$10$xtXa7Gb2xhO.FVqwO0yQ1.3pIbTOgibj5PMoWLkTePq3bho0t8haS',
  'marketing'
)
ON CONFLICT (email) DO NOTHING;
