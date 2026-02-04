
create table if not exists user_one_rms (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    exercise_id uuid references exercises(id) on delete cascade not null,
    one_rm numeric not null check (one_rm > 0),
    type text check (type in ('manual', 'training_max')) default 'manual',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, exercise_id)
);

-- RLS Policies
alter table user_one_rms enable row level security;

create policy "Users can view own one rms"
    on user_one_rms for select
    using (auth.uid() = user_id);

create policy "Users can insert own one rms"
    on user_one_rms for insert
    with check (auth.uid() = user_id);

create policy "Users can update own one rms"
    on user_one_rms for update
    using (auth.uid() = user_id);

create policy "Users can delete own one rms"
    on user_one_rms for delete
    using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger handle_updated_at before update on user_one_rms
    for each row execute procedure moddatetime (updated_at);
