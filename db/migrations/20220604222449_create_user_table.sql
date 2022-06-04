-- migrate:up
CREATE TABLE IF NOT EXISTS users (
  id text primary key,
  email text,
  first_name text,
  last_name text,
  password text,
  created_at timestamp default current_timestamp
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- migrate:down
DROP INDEX IF EXISTS users_email_idx;
DROP TABLE IF EXISTS users;
