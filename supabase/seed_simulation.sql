/*
  # 1RM Logbook - Realistic Data Simulation (2 Months)
  
  This script simulates a user ("PowerBuilder") training for 8 weeks.
  It covers:
  - Creating Exercises (Bench, Squat, Deadlift, etc.)
  - Creating a Program (Winter Bulk)
  - Creating Templates (Upper/Lower)
  - Generating ~24 Sessions (3x/week)
  - Logging sets with progressive overload (Linear Progression)
  
  INSTRUCTIONS:
  1. This script attempts to use the FIRST user found in auth.users.
  2. If you want a specific user, change the value of `v_user_id` inside the DO block.
  3. Run in Supabase SQL Editor.
*/

DO $$
DECLARE
    v_user_id uuid;
    v_program_id uuid;
    v_tmpl_upper_id uuid;
    v_tmpl_lower_id uuid;
    
    -- Exercise IDs
    v_ex_bench uuid;
    v_ex_squat uuid;
    v_ex_dl uuid;
    v_ex_ohp uuid;
    v_ex_row uuid;
    
    -- Loop vars
    v_week int;
    v_session_count int;
    v_date timestamp;
    v_session_id uuid;
    
    -- Progression vars
    v_bench_weight numeric := 80;
    v_squat_weight numeric := 100;
    v_dl_weight numeric := 120;
    v_ohp_weight numeric := 50;
    v_row_weight numeric := 70;
BEGIN
    -- 1. GET USER (First user in DB)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in auth.users. Create a user first!';
    END IF;

    RAISE NOTICE 'Simulating data for User ID: %', v_user_id;

    -- 2. CREATE SETTINGS
    INSERT INTO public.progression_settings (user_id, progression_rate, deload_rate, target_rir, enable_auto_progression)
    VALUES (v_user_id, 0.025, 0.10, 2, true)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. CREATE EXERCISES (Upsert style)
    -- Helper function not available in DO block, so we do manual checks or insert if not exists
    
    -- Bench Press
    INSERT INTO public.exercises (name, body_parts, type, user_id) 
    SELECT 'Bench Press (Barbell)', ARRAY['chest'], 'barbell', v_user_id 
    WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Bench Press (Barbell)' AND user_id = v_user_id)
    RETURNING id INTO v_ex_bench;
    
    IF v_ex_bench IS NULL THEN SELECT id INTO v_ex_bench FROM public.exercises WHERE name = 'Bench Press (Barbell)' AND user_id = v_user_id; END IF;

    -- Squat
    INSERT INTO public.exercises (name, body_parts, type, user_id) 
    SELECT 'Back Squat', ARRAY['legs'], 'barbell', v_user_id 
    WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Back Squat' AND user_id = v_user_id)
    RETURNING id INTO v_ex_squat;
    
    IF v_ex_squat IS NULL THEN SELECT id INTO v_ex_squat FROM public.exercises WHERE name = 'Back Squat' AND user_id = v_user_id; END IF;

    -- Deadlift
    INSERT INTO public.exercises (name, body_parts, type, user_id) 
    SELECT 'Deadlift', ARRAY['back'], 'barbell', v_user_id 
    WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Deadlift' AND user_id = v_user_id)
    RETURNING id INTO v_ex_dl;
    
    IF v_ex_dl IS NULL THEN SELECT id INTO v_ex_dl FROM public.exercises WHERE name = 'Deadlift' AND user_id = v_user_id; END IF;

    -- OHP
    INSERT INTO public.exercises (name, body_parts, type, user_id) 
    SELECT 'Overhead Press', ARRAY['shoulders'], 'barbell', v_user_id 
    WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Overhead Press' AND user_id = v_user_id)
    RETURNING id INTO v_ex_ohp;
    
    IF v_ex_ohp IS NULL THEN SELECT id INTO v_ex_ohp FROM public.exercises WHERE name = 'Overhead Press' AND user_id = v_user_id; END IF;

    -- Row
    INSERT INTO public.exercises (name, body_parts, type, user_id) 
    SELECT 'Barbell Row', ARRAY['back'], 'barbell', v_user_id 
    WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Barbell Row' AND user_id = v_user_id)
    RETURNING id INTO v_ex_row;
    
    IF v_ex_row IS NULL THEN SELECT id INTO v_ex_row FROM public.exercises WHERE name = 'Barbell Row' AND user_id = v_user_id; END IF;


    -- 4. CREATE PROGRAM
    INSERT INTO public.programs (user_id, name, description, start_date, is_active)
    VALUES (v_user_id, 'Winter Powerbuilding', 'Focus on compound movements + linear progression', NOW() - interval '2 months', true)
    RETURNING id INTO v_program_id;

    -- 5. CREATE TEMPLATES
    -- Upper A
    INSERT INTO public.workout_templates (program_id, name, "order")
    VALUES (v_program_id, 'Upper A', 1)
    RETURNING id INTO v_tmpl_upper_id;
    
    -- Link Exercises to Upper A
    INSERT INTO public.template_exercises (workout_template_id, exercise_id, "order", target_sets, target_reps_min, target_reps_max, target_rir) VALUES
    (v_tmpl_upper_id, v_ex_bench, 1, 3, 5, 8, 2),
    (v_tmpl_upper_id, v_ex_row, 2, 3, 8, 12, 2),
    (v_tmpl_upper_id, v_ex_ohp, 3, 3, 8, 12, 2);

    -- Lower B
    INSERT INTO public.workout_templates (program_id, name, "order")
    VALUES (v_program_id, 'Lower B', 2)
    RETURNING id INTO v_tmpl_lower_id;
    
     -- Link Exercises to Lower B
    INSERT INTO public.template_exercises (workout_template_id, exercise_id, "order", target_sets, target_reps_min, target_reps_max, target_rir) VALUES
    (v_tmpl_lower_id, v_ex_squat, 1, 3, 5, 5, 2),
    (v_tmpl_lower_id, v_ex_dl, 2, 2, 5, 5, 3); -- Deadlift lower volume

    -- 6. GENERATE SESSIONS (8 Weeks, 3 days/week = 24 sessions)
    -- Schedule: Mon (Upper), Wed (Lower), Fri (Upper) -> Alternate? Let's just do A/B/A week 1, B/A/B week 2 (ABAB pattern)
    
    -- We start 8 weeks ago
    FOR v_week IN 0..7 LOOP
        -- Session 1 of week (Monday)
        v_date := (NOW() - interval '8 weeks') + (v_week || ' weeks')::interval;
        
        -- Logic: Alternate templates. Even index = A, Odd = B
        -- Simple pattern: Mon=Upper, Wed=Lower, Fri=Upper (High upper frequency simulation)
        
        -- --- MONDAY (UPPER) ---
        INSERT INTO public.workout_sessions (user_id, workout_template_id, date, duration_seconds, notes)
        VALUES (v_user_id, v_tmpl_upper_id, v_date + time '18:00', 3600 + (random() * 600)::int, 'Week ' || (v_week + 1) || ' - Monday Grind')
        RETURNING id INTO v_session_id;

        -- Log Bench (Linear Prog: +2.5kg every 2 weeks approx, let's just add 1.25 every week)
        INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir) VALUES
        (v_session_id, v_ex_bench, 1, 8, v_bench_weight + (v_week * 1.25), 2),
        (v_session_id, v_ex_bench, 2, 8, v_bench_weight + (v_week * 1.25), 2),
        (v_session_id, v_ex_bench, 3, 7, v_bench_weight + (v_week * 1.25), 1); -- Last set harder

        -- Log Row
        INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir) VALUES
        (v_session_id, v_ex_row, 1, 10, v_row_weight + (v_week * 1), 3),
        (v_session_id, v_ex_row, 2, 10, v_row_weight + (v_week * 1), 3);

        -- Log OHP
        INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir) VALUES
        (v_session_id, v_ex_ohp, 1, 10, v_ohp_weight + (v_week * 0.5), 2);


        -- --- WEDNESDAY (LOWER) ---
        v_date := v_date + interval '2 days'; -- Wed
        INSERT INTO public.workout_sessions (user_id, workout_template_id, date, duration_seconds, notes)
        VALUES (v_user_id, v_tmpl_lower_id, v_date + time '17:30', 4000 + (random() * 500)::int, 'Leg day, feeling strong')
        RETURNING id INTO v_session_id;

        -- Log Squat (+2.5kg per week)
        INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir) VALUES
        (v_session_id, v_ex_squat, 1, 5, v_squat_weight + (v_week * 2.5), 2),
        (v_session_id, v_ex_squat, 2, 5, v_squat_weight + (v_week * 2.5), 2),
        (v_session_id, v_ex_squat, 3, 5, v_squat_weight + (v_week * 2.5), 2);

        -- Log Deadlift
        INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir) VALUES
        (v_session_id, v_ex_dl, 1, 5, v_dl_weight + (v_week * 2.5), 3);


        -- --- FRIDAY (UPPER) ---
        v_date := v_date + interval '2 days'; -- Fri
        INSERT INTO public.workout_sessions (user_id, workout_template_id, date, duration_seconds, notes)
        VALUES (v_user_id, v_tmpl_upper_id, v_date + time '20:00', 3800, 'Friday night pump')
        RETURNING id INTO v_session_id;

        -- Log Bench (Same weight as Mon, maybe more reps?)
        INSERT INTO public.exercise_logs (session_id, exercise_id, set_number, reps, weight, rir) VALUES
        (v_session_id, v_ex_bench, 1, 8, v_bench_weight + (v_week * 1.25), 2),
        (v_session_id, v_ex_bench, 2, 8, v_bench_weight + (v_week * 1.25), 2),
        (v_session_id, v_ex_bench, 3, 8, v_bench_weight + (v_week * 1.25), 1); -- Better performance than Mon

    END LOOP;

    RAISE NOTICE 'Simulation complete. Enjoy your gains!';
END $$;
