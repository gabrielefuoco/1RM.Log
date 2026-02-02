-- Sembra che la tabella "progression_settings" manchi nel tuo database.
-- Esegui questo script per crearla prima di riprovare la simulazione.

create table if not exists public.progression_settings (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  progression_rate numeric not null default 0.025, -- 2.5% increment
  deload_rate numeric not null default 0.10, -- 10% decrease
  target_rir integer not null default 2,
  enable_auto_progression boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.progression_settings enable row level security;

-- Policies (sicure, usano IF NOT EXISTS dove possibile o drop/create se necessario, qui usiamo semplice create)
-- Nota: Supabase SQL editor gestisce bene i duplicati policy se si usa "create policy if not exists" ma PostgreSQL standard no.
-- Assumiamo che non esistano dato che la tabella non esisteva.

create policy "Users can view own settings" on public.progression_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on public.progression_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.progression_settings for insert with check (auth.uid() = user_id);
