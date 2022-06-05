-- migrate:up
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS updated_at timestamp default current_timestamp;

-- migrate:down
ALTER TABLE IF EXISTS public.users
DROP COLUMN IF EXISTS updated_at;
