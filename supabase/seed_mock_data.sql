-- 1RM Logbook Seed Script: 2 Months of Intense Training
-- To run: Copy and paste this into the Supabase SQL Editor.

BEGIN;

-- 1. CLEANUP (Careful: this deletes all user data in these tables)
TRUNCATE public.exercise_logs, public.workout_sessions, public.bodyweight_logs CASCADE;

-- 2. ENSURE CORE EXERCISES EXIST
-- We use a temporary table to store IDs for the rest of the script
CREATE TEMP TABLE seed_exercises (id uuid, name text);

WITH new_ex AS (
  INSERT INTO public.exercises (name, body_parts, type)
  VALUES 
    ('Squat', '{Quadriceps, Glutes}', 'barbell'),
    ('Bench Press', '{Chest, Triceps, Shoulders (Front)}', 'barbell'),
    ('Deadlift', '{Back (Lower), Hamstrings, Glutes}', 'barbell'),
    ('Overhead Press', '{Shoulders (Front), Triceps}', 'barbell'),
    ('Barbell Row', '{Back (Upper/Traps), Biceps}', 'barbell')
  RETURNING id, name
)
INSERT INTO seed_exercises SELECT * FROM new_ex;

-- 3. INSERT BODYWEIGHT LOGS (Progressive weight loss/gain simulation)
INSERT INTO public.bodyweight_logs (user_id, weight, date)
SELECT 
  (SELECT id FROM auth.users LIMIT 1), -- Assumes at least one user exists
  80 - (i * 0.1), -- Simulating losing 0.1kg per week
  CURRENT_DATE - (INTERVAL '1 day' * (60 - i))
FROM generate_series(0, 60, 7) AS i;

-- 4. SIMULATE 2 MONTHS OF WORKOUTS (3 sessions per week)
-- We'll create Session A (Squat, Bench, Row) and Session B (Deadlift, OHP, Squat)
DO $$
DECLARE
  target_user_id uuid;
  current_sess_id uuid;
  ex_squat_id uuid;
  ex_bench_id uuid;
  ex_dead_id uuid;
  ex_ohp_id uuid;
  ex_row_id uuid;
  i int;
  sess_date timestamp;
  base_weight numeric;
BEGIN
  SELECT id INTO target_user_id FROM auth.users LIMIT 1;
  SELECT id INTO ex_squat_id FROM seed_exercises WHERE name = 'Squat';
  SELECT id INTO ex_bench_id FROM seed_exercises WHERE name = 'Bench Press';
  SELECT id INTO ex_dead_id FROM seed_exercises WHERE name = 'Deadlift';
  SELECT id INTO ex_ohp_id FROM seed_exercises WHERE name = 'Overhead Press';
  SELECT id INTO ex_row_id FROM seed_exercises WHERE name = 'Barbell Row';

  FOR i IN 0..24 LOOP -- ~3 sessions per week for 8 weeks
    sess_date := CURRENT_DATE - (INTERVAL '60 days') + (INTERVAL '1 day' * (i * 2.3));
    
    INSERT INTO public.workout_sessions (user_id, date, duration_seconds, notes)
    VALUES (target_user_id, sess_date, 3600, 'Mock Session #' || i)
    RETURNING id INTO current_sess_id;

    IF i % 2 = 0 THEN
      -- Session A: Squat, Bench, Row
      -- Squat (Linear progression: 60kg + 2.5kg every A session)
      base_weight := 60 + (i * 1.25);
      INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir)
      VALUES 
        (current_sess_id, ex_squat_id, 1, 5, base_weight, 2),
        (current_sess_id, ex_squat_id, 2, 5, base_weight, 2),
        (current_sess_id, ex_squat_id, 3, 5, base_weight, 1);
      
      -- Bench (+2kg every A session)
      base_weight := 40 + (i * 1.0);
      INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir)
      VALUES 
        (current_sess_id, ex_bench_id, 1, 8, base_weight, 2),
        (current_sess_id, ex_bench_id, 2, 8, base_weight, 2),
        (current_sess_id, ex_bench_id, 3, 8, base_weight, 1);

      -- Row
      base_weight := 30 + (i * 0.5);
      INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir)
      VALUES (current_sess_id, ex_row_id, 1, 10, base_weight, 2);

    ELSE
      -- Session B: Deadlift, OHP, Squat (light)
      -- Deadlift (+5kg every B session)
      base_weight := 80 + (i * 2.5);
      INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir)
      VALUES (current_sess_id, ex_dead_id, 1, 5, base_weight, 2);

      -- OHP
      base_weight := 20 + (i * 0.5);
      INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir)
      VALUES 
        (current_sess_id, ex_ohp_id, 1, 8, base_weight, 2),
        (current_sess_id, ex_ohp_id, 2, 8, base_weight, 2);

      -- Squat (Light)
      base_weight := (60 + (i * 1.25)) * 0.8;
      INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir)
      VALUES (current_sess_id, ex_squat_id, 1, 10, base_weight, 3);
    END IF;
  END LOOP;
END $$;

COMMIT;
