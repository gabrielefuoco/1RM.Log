# Architettura Tecnica - 1RM Logbook

> [!IMPORTANT]
> **REGOLE DI AUTO-AGGIORNAMENTO**: Aggiorna questo file ogni volta che vengono introdotti nuovi pattern architetturali, modifiche al build system (es. passaggio a Turbopack) o cambiamenti nella strategia di gestione dello stato.

## 1. Stack & Build System
- **Framework**: Next.js 16 (App Router).
- **Bundler**: **Webpack** (Forzato via `next build --webpack`). Turbopack è disabilitato per incompatibilità con il plugin PWA.
- **Runtime**: Node.js 20+.

## 2. Gestione dello Stato & Data Flow
### Server State
- **TanStack Query (React Query)**: Utilizzato per il fetching e il caching.
- **Configurazione**: `staleTime: 60000` (1 minuto). `refetchOnWindowFocus: false`.
- **Pattern**: I hook personalizzati in `hooks/` wrappano le chiamate Supabase.

### Mutazioni, Modelli Locali & UI State
- **Hooks Centralizzati per Editing**: Per l'editing di liste complesse (es. Configurazione Set per Esercizio), l'app delega tutto lo stato a un hook orchestratore centralizzato (es. `useTemplateSetEditor`) per mantenere isolata la logica rispetto alla UI.
- **Pattern Imperativo**: Le mutazioni pesanti (come salvare un set nel runner) utilizzano chiamate dirette ai `services/` seguite da aggiornamenti manuali dello stato locale del componente per garantire reattività istantanea senza attendere l'invalidazione della query.
- **Stable React Keys per DND**: Nelle liste dinamiche o che supportano Drag-and-Drop (es. `@dnd-kit`), usa **SEMPRE** chiavi stabili basate sull'identità logica generata ad-hoc (`_id: crypto.randomUUID()`) per ogni elemento per preservare lo stato interno dei componenti (timer, input manuali, posizioni di ref) durante i re-render o i riordinamenti.

## 3. Service Layer
- **Percorso**: `services/*.ts`.
- **Responsabilità**: Logica di business pura e interazione con Supabase.
- **Esempi**:
    - `workout.ts`: Gestione sessioni e log.
    - `progression.ts`: Calcoli di progressione del carico.

## 4. Middleware & Sicurezza
- **Middleware**: `lib/supabase/middleware.ts` gestisce il refresh della sessione e il redirect a `/login` per rotte protette.
- **Auth**: Supabase SSR (`@supabase/ssr`).

## 5. PWA
- **Plugin**: `@ducanh2912/next-pwa`.
- **Configurazione**: Destinazione `public`, disabilitato in development.
