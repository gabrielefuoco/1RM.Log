-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Exercises
create type exercise_type as enum ('barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other');
create type body_part as enum ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body');

create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  body_part body_part not null,
  type exercise_type not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) default auth.uid()
);

-- Programs (Macrocycle)
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid() not null,
  name text not null,
  description text,
  start_date date not null,
  end_date date,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Templates (Mesocycle/Microcycle definitions)
create table public.workout_templates (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  name text not null, -- e.g. "Giorno 2 - Upper"
  "order" integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Template Exercises
create type set_type as enum ('straight', 'top_set', 'backoff', 'warmup', 'myorep');

create table public.template_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_template_id uuid references public.workout_templates(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  
  target_sets integer not null default 3,
  target_reps_min integer,
  target_reps_max integer,
  target_rir integer, -- Reps In Reserve target
  type set_type default 'straight',
  sets_data jsonb default '[]', -- JSON array for per-set configuration
  
  "order" integer not null default 0
);

-- Workout Sessions (Real execution)
create table public.workout_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid() not null,
  workout_template_id uuid references public.workout_templates(id), -- Nullable if ad-hoc
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  duration_seconds integer,
  session_rpe integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercise Logs (Sets)
create table public.exercise_logs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  
  set_type text default 'work' check (set_type in ('work', 'warmup', 'drop', 'failure')),
  set_number integer not null,
  reps integer not null,
  weight numeric not null, -- kg
  rir integer,
  
  -- Calculated 1RM (Epley formula: weight * (1 + reps/30))
  estimated_1rm numeric generated always as (
    case when reps > 0 then weight * (1 + reps::numeric / 30) else 0 end
  ) stored,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Basic RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

-- Exercises: System exercises (user_id is null) + User exercises
create policy "Users can view exercises" on public.exercises for select using (auth.uid() = user_id or user_id is null);
create policy "Users can insert exercises" on public.exercises for insert with check (auth.uid() = user_id);
create policy "Users can update own exercises" on public.exercises for update using (auth.uid() = user_id);
create policy "Users can delete own exercises" on public.exercises for delete using (auth.uid() = user_id);

create policy "Users can manage own programs" on public.programs for all using (auth.uid() = user_id);
create policy "Users can manage own sessions" on public.workout_sessions for all using (auth.uid() = user_id);

-- For related tables, check ownership via joins (simplified for initial setup, can be refined)
create policy "Users can manage own workout templates" on public.workout_templates for all using (
  program_id in (select id from public.programs where user_id = auth.uid())
);

create policy "Users can manage own template exercises" on public.template_exercises for all using (
  workout_template_id in (select wt.id from public.workout_templates wt join public.programs p on wt.program_id = p.id where p.user_id = auth.uid())
);

create policy "Users can manage own logs" on public.exercise_logs for all using (
  session_id in (select id from public.workout_sessions where user_id = auth.uid())
);

-- Progression Settings (User Preferences)
create table public.progression_settings (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  progression_rate numeric not null default 0.025, -- 2.5% increment
  deload_rate numeric not null default 0.10, -- 10% decrease
  target_rir integer not null default 2,
  max_plate_weight numeric not null default 20, -- 20kg or 25kg common max
  enable_auto_progression boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.progression_settings enable row level security;

create policy "Users can view own settings" on public.progression_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on public.progression_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.progression_settings for insert with check (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_exercise_logs_session_id on public.exercise_logs(session_id);
create index if not exists idx_exercise_logs_exercise_id_created_at on public.exercise_logs(exercise_id, created_at desc);
create index if not exists idx_workout_templates_program_id on public.workout_templates(program_id);
create index if not exists idx_template_exercises_workout_template_id on public.template_exercises(workout_template_id);
create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, date desc);
