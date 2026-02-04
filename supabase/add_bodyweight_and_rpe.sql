-- Create intensity_type enum if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'intensity_type') then
    create type intensity_type as enum ('RIR', 'RPE');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_sex') then
    create type user_sex as enum ('male', 'female');
  end if;
end$$;

-- Add intensity_type and sex to progression_settings
alter table public.progression_settings 
add column if not exists intensity_type intensity_type default 'RIR',
add column if not exists sex user_sex default 'male';

-- Create bodyweight_logs table
create table if not exists public.bodyweight_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  weight numeric not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bodyweight_logs enable row level security;

-- Policies for bodyweight_logs
create policy "Users can manage own bodyweight logs" on public.bodyweight_logs
  for all using (auth.uid() = user_id);

-- Performance Index
create index if not exists idx_bodyweight_logs_user_date on public.bodyweight_logs(user_id, date desc);

-- Add bodyweight_at_time to exercise_logs for historical tracking
alter table public.exercise_logs
add column if not exists bodyweight_at_time numeric;
