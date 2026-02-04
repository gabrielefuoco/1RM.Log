---
trigger: always_on
---

# 1RM Logbook - Project Rules & Context

Questo file contiene le regole, lo stack tecnologico e lo stato del progetto. **Leggi questo file all'inizio di ogni sessione.**

## 1. Visione & Filosofia
L'obiettivo è creare un **Logbook per l'allenamento della forza** (Powerlifting/Bodybuilding) che sia:
1.  **Scientifico**: Calcola automaticamente 1RM ed Epley formula.
2.  **Veloce**: Input ottimizzato per l'uso in palestra (mobile-first).
3.  **Intelligente**: Suggerisce la progressione dei carichi basandosi sul RIR e performance passate.
4.  **Low Cost**: Stack tecnologico gratuito ma professionale.

## 2. Tech Stack (Survival Kit)
Lo stack è definito e installato. **Non deviare da queste scelte.**

-   **Frontend**: Next.js 16 (App Router).
-   **Language**: TypeScript.
-   **Styling**: Tailwind CSS v4 + **Shadcn/ui** (Radix UI).
    -   *Font*: **Inter** (configurato in `layout.tsx`).
    -   *Icons*: **Lucide React**.
-   **Backend/DB**: Supabase (Postgres, Auth, Realtime).
-   **State/Data**: TanStack Query (React Query).
-   **PWA**: `@ducanh2912/next-pwa` (Supporto offline/installazione).

### 🛠 Librerie Core
-   **Forms**: `react-hook-form` + `zod` (Validazione schema).
-   **Analytics**: `recharts` (Grafici trend 1RM).
-   **UX**: `sonner` (Toast notifications), `@formkit/auto-animate` (Liste).
-   **Utils**: `date-fns`, `react-timer-hook`, `clsx`, `tailwind-merge`.

> [!IMPORTANT]
> **Comando di Avvio**: Usa sempre `npm run dev` (configurato per usare Webpack).
> Turbopack è attualmente disabilitato per incompatibilità con il plugin PWA.

## 3. Architettura Dati (Supabase)
Lo schema è definito in `supabase/schema.sql`.

### Entità Principali
-   **`exercises`**: Repertorio esercizi (Panca, Squat).
    -   *Tip*: Include `body_part` e `type` (bilanciere, manubrio).
-   **`programs`**: Macrociclo (es. "Inverno 2024").
-   **`workout_templates`**: Schede modello (es. "Upper Body A").
-   **`workout_sessions`**: L'allenamento svolto in una data specifica.
-   **`exercise_logs`**: I set eseguiti (Peso, Reps, RIR).
    -   **Campo Chiave**: `estimated_1rm` (Generated Column: `weight * (1 + reps/30)`).
-   **`bodyweight_logs`**: Storico peso corporeo utente (Data, Peso).
-   **`progression_settings`**: Include ora `intensity_type` (RIR/RPE) e `sex` (Male/Female).

## 4. Logica Funzionale ("Il Cervello")

### A. Calcolo 1RM
Non chiedere mai l'1RM all'utente. Calcolalo e salvalo in `estimated_1rm` ogni volta che salva un set.
-   *Best Lift Query*: `MAX(estimated_1rm)` per esercizio.

### B. Algoritmo di Progressione
Quando si inizializza una sessione da un template:
1.  Cerca l'ultimo log dello stesso esercizio.
2.  Confronta `RIR Target` vs `RIR Effettivo`.
    -   Se RIR Effettivo > Target (+2 riserva): **Suggerisci +2.5% peso**.
    -   Se Reps > Target Max: **Suggerisci +Peso**.
    -   Se RIR < 0 (Fallimento): **Suggerisci stesso peso o scarico (--10%)**.

### C. Powerlifting Analytics
-   **Punteggi Competizione**: Calcolo automatico di DOTS, Wilks e IPF GL Points.
-   **SBD Total**: Somma automatica dei massimali stimati di Squat, Bench e Deadlift.
-   **Relatività**: I punteggi usano il peso corporeo storico dell'utente al momento del lift.

### D. UI Mobile-First
-   Input numerici giganti.
-   Nessuno scroll orizzontale.
-   Dark Mode di default (OLED friendly).


## 5. Regole di Sviluppo
1.  **Non reinventare**: Usa i componenti Shadcn per tutto.
2.  **Atomic Commits**: Fai task piccoli e verificabili.
3.  **Type Safety**: Usa Zod per validare ogni input e risposta DB.

> [!IMPORTANT]
> **Gestione delle Regole**:
> - **Auto-Aggiornamento**: Ogni file in `.agent/rules/` deve essere aggiornato dall'agente ogni volta che la sua area di competenza cambia.
> - **Nuove Regole**: Crea un nuovo file specializzato in `.agent/rules/` se un'area del progetto diventa complessa o importante (es. Integrazione AI, Wearables, Analytics Avanzate).