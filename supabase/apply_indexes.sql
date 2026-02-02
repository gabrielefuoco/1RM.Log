-- Applicare questi indici per migliorare le performance.
-- Eseguire questo script nell'SQL Editor di Supabase.

create index if not exists idx_exercise_logs_session_id on public.exercise_logs(session_id);
create index if not exists idx_exercise_logs_exercise_id_created_at on public.exercise_logs(exercise_id, created_at desc);
create index if not exists idx_workout_templates_program_id on public.workout_templates(program_id);
create index if not exists idx_template_exercises_workout_template_id on public.template_exercises(workout_template_id);
create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, date desc);
