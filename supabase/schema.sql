
-- Enable Extensions
create extension if not exists "moddatetime" with schema "extensions";

-- 1. Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. Exercises
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  body_parts text[] default '{}'::text[],
  type text not null,
  image_url text,
  user_id uuid references auth.users(id), -- Null for system/global exercises
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.exercises enable row level security;
create policy "Public exercises are viewable by everyone" on exercises for select using (user_id is null);
create policy "Users can view own exercises" on exercises for select using (auth.uid() = user_id);
create policy "Users can insert own exercises" on exercises for insert with check (auth.uid() = user_id);
create policy "Users can update own exercises" on exercises for update using (auth.uid() = user_id);

-- 3. Programs
create table if not exists public.programs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  description text,
  start_date date not null default CURRENT_DATE,
  end_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.programs enable row level security;
create policy "Users can view own programs" on programs for select using (auth.uid() = user_id);
create policy "Users can insert own programs" on programs for insert with check (auth.uid() = user_id);
create policy "Users can update own programs" on programs for update using (auth.uid() = user_id);
create policy "Users can delete own programs" on programs for delete using (auth.uid() = user_id);

-- 4. Workout Templates
create table if not exists public.workout_templates (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references programs(id) on delete cascade not null,
  name text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.workout_templates enable row level security;
create policy "Users can view own templates" on workout_templates for select using (
    exists ( select 1 from programs p where p.id = workout_templates.program_id and p.user_id = auth.uid() )
);
create policy "Users can insert own templates" on workout_templates for insert with check (
    exists ( select 1 from programs p where p.id = program_id and p.user_id = auth.uid() )
);
create policy "Users can update own templates" on workout_templates for update using (
    exists ( select 1 from programs p where p.id = program_id and p.user_id = auth.uid() )
);
create policy "Users can delete own templates" on workout_templates for delete using (
    exists ( select 1 from programs p where p.id = program_id and p.user_id = auth.uid() )
);

-- 5. Template Exercises
create table if not exists public.template_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_template_id uuid references workout_templates(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  target_sets integer default 3,
  target_reps_min integer,
  target_reps_max integer,
  target_rir integer,
  type text default 'straight',
  sets_data jsonb default '[]'::jsonb,
  "order" integer default 0
);
alter table public.template_exercises enable row level security;
create policy "Users can view own template exercises" on template_exercises for select using (
    exists ( select 1 from workout_templates t join programs p on p.id = t.program_id where t.id = template_exercises.workout_template_id and p.user_id = auth.uid() )
);
create policy "Users can manage own template exercises" on template_exercises for all using (
     exists ( select 1 from workout_templates t join programs p on p.id = t.program_id where t.id = workout_template_id and p.user_id = auth.uid() )
);

-- 6. Workout Sessions
create table if not exists public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  workout_template_id uuid references workout_templates(id),
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  duration_seconds integer,
  session_rpe integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.workout_sessions enable row level security;
create policy "Users can view own sessions" on workout_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on workout_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on workout_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on workout_sessions for delete using (auth.uid() = user_id);

-- 7. Exercise Logs
create table if not exists public.exercise_logs (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references workout_sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  set_type text default 'work',
  set_number integer not null,
  reps integer not null,
  weight numeric not null,
  rir numeric,
  estimated_1rm numeric generated always as (weight * (1 + reps::numeric / 30)) stored,
  bodyweight_at_time numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.exercise_logs enable row level security;
create policy "Users can view own logs" on exercise_logs for select using (
    exists ( select 1 from workout_sessions s where s.id = exercise_logs.session_id and s.user_id = auth.uid() )
);
create policy "Users can manage own logs" on exercise_logs for all using (
    exists ( select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid() )
);

-- 8. Bodyweight Logs
create table if not exists public.bodyweight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  weight numeric not null,
  date date default CURRENT_DATE not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.bodyweight_logs enable row level security;
create policy "Users can manage own bodyweight" on bodyweight_logs for all using (auth.uid() = user_id);

-- 9. Progression Settings
create table if not exists public.progression_settings (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  progression_rate numeric not null default 0.025,
  deload_rate numeric not null default 0.10,
  target_rir integer not null default 2,
  enable_auto_progression boolean default true,
  max_plate_weight numeric default 20,
  intensity_type text default 'RIR',
  sex text default 'male',
  rounding_increment numeric DEFAULT 2.5,
  one_rm_update_policy text DEFAULT 'confirm' CHECK (one_rm_update_policy IN ('manual', 'confirm', 'auto')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.progression_settings enable row level security;
create policy "Users can view own settings" on progression_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on progression_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on progression_settings for insert with check (auth.uid() = user_id);

create trigger handle_updated_at before update on progression_settings
    for each row execute procedure moddatetime (updated_at);

-- 10. User One RMs (Training Max / Overrides)
create table if not exists public.user_one_rms (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    exercise_id uuid references exercises(id) on delete cascade not null,
    one_rm numeric not null check (one_rm > 0),
    type text check (type in ('manual', 'training_max')) default 'manual',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, exercise_id)
);
alter table public.user_one_rms enable row level security;
create policy "Users can manage own one rms" on user_one_rms for all using (auth.uid() = user_id);

create trigger handle_updated_at before update on user_one_rms
    for each row execute procedure moddatetime (updated_at);

