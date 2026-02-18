-- 1. Progression Definitions (Library)
create table if not exists public.progression_definitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  type text not null, -- 'double', 'linear', 'percentage_sequence'
  config jsonb not null default '{}'::jsonb, -- { "steps": [...], "increment": ... }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.progression_definitions enable row level security;

create policy "Users can view own progressions" on progression_definitions 
  for select using (auth.uid() = user_id);

create policy "Users can manage own progressions" on progression_definitions 
  for all using (auth.uid() = user_id);

-- 2. Update Template Exercises
alter table public.template_exercises 
add column if not exists progression_mode text default 'static', -- 'static', 'auto_double', 'auto_linear', 'custom_sequence'
add column if not exists progression_config jsonb default '{}'::jsonb, 
add column if not exists progression_state jsonb default '{}'::jsonb;
