-- Migration: Multi-category support for exercises

-- 1. Create temporary column
ALTER TABLE public.exercises ADD COLUMN body_parts text[] DEFAULT '{}'::text[];

-- 2. Migrate existing data (mapping single text to array)
UPDATE public.exercises SET body_parts = ARRAY[body_part] WHERE body_part IS NOT NULL;

-- 3. Drop old column
ALTER TABLE public.exercises DROP COLUMN body_part;

-- 4. Ensure RLS still works (it uses user_id, which is unchanged)
-- No changes needed to RLS for basic select/insert.
