# Database & Supabase - 1RM Logbook

> [!IMPORTANT]
> **REGOLE DI AUTO-AGGIORNAMENTO**: Aggiorna questo file ogni volta che lo schema SQL viene modificato, quando vengono aggiunti nuovi trigger o funzioni Postgres, o se le policy RLS subiscono cambiamenti.

## 1. Gerarchia Dati (Relazioni)
La struttura segue un modello piramidale dal piano alla singola esecuzione:
- **`programs`**: Macrociclo (Pianificazione alto livello).
- **`progression_definitions`**: Libreria di schemi di progressione riutilizzabili.
- **`workout_templates`**: Sessioni tipo (Mesociclo/Microciclo).
- **`template_exercises`**: Configurazione esercizio (Sets, Reps, **Progression Mode**).
- **`workout_sessions`**: Esecuzione reale in data X.
- **`exercise_logs`**: Singolo set (Peso, Reps, RIR, 1RM Stimato).
- **`bodyweight_logs`**: Tracciamento peso corporeo nel tempo.

## 2. Row Level Security (RLS)
- **Policy**: Ogni tabella ha RLS abilitato.
- **Isolamento**: Gli utenti possono vedere e gestire solo i PROPRI dati (`user_id = auth.uid()`).
- **Eccezione**: Gli esercizi (`exercises`) hanno `user_id` null per quelli di sistema, visibili a tutti.

## 3. Generazione Dati (Simulation)
- **Script**: `supabase/seed_simulation.sql`.
- **Utilizzo**: Simula 8 settimane di progressione lineare per testare grafici e algoritmi.
- **Importante**: Da usare solo in ambiente di test/staging locale.

## 4. Indici Critici
- `idx_exercise_logs_exercise_id_created_at`: Essenziale per il calcolo veloce della progressione basato sullo storico.
- `idx_workout_sessions_user_date`: Velocizza il caricamento della dashboard e dello storico.

## 5. Tipi di Dati Custom (Enum)
- `exercise_type`: barbell, dumbbell, cable, machine, bodyweight, other.
- `body_part`: chest, back, legs, shoulders, arms, core, full_body.
- `set_type`: straight, top_set, backoff, warmup, myorep.
- `intensity_type`: RIR, RPE.
- `user_sex`: male, female.
