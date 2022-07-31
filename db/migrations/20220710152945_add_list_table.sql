-- migrate:up
CREATE TABLE IF NOT EXISTS public.list (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  transaction_id BIGINT NOT NULL,
  query TEXT NOT NULL,
  query_type TEXT NOT NULL,
  acctivity TEXT,
  old_data jsonb,
  new_data jsonb,
  user_id TEXT NOT NULL,
  CONSTRAINT user_foreign_key FOREIGN KEY (user_id) REFERENCES users(id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL
);

-- migrate:down
DROP TABLE IF EXISTS public.list
