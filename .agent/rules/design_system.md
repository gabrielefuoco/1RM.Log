# Design System - 1RM Logbook

> [!IMPORTANT]
> **REGOLE DI AUTO-AGGIORNAMENTO**: Aggiorna questo file ogni volta che vengono aggiunti nuovi token CSS, classi utility globali o se l'estetica generale dell'app subisce un rebranding.

## 1. Estetica: "Industrial Jungle"
L'app utilizza un design ad alto contrasto, OLED-friendly, con accenti neon organici.
- **Background**: Deep Organic Black (`#020a07`).
- **Accent/Primary**: Electric Mint (`#00ffa3`).
- **Cards**: Dark Jungle Green (`#0a1f18`).
- **Texture**: Grid sottile 40x40px applicata al background del body.

## 2. Tipografia
- **Headings (Titoli)**: **Oswald**. Sempre in uppercase, tracking Wide.
- **UI/Body**: **Inter**. Per leggibilità su schermi piccoli.
- **Data/Timers**: **JetBrains Mono**. Per un look tecnico/ingegneristico.

## 3. Tailwind CSS v4 & Utility Personali
Utilizziamo Tailwind v4 con plugin `tailwindcss-animate`.
### Utility Personalizzate (in `globals.css`):
- **Border Radius Standardizzato**: Usa sempre `rounded-lg` (8px) per container esterni/cards, e `rounded-md` (6px) per elementi interni (badge, input). Evita raggi non standard.
- **`.card-hover-fx`**: Aggiungi questa classe agli elementi interattivi (come card di allenamento) per abilitare l'effetto di sollevamento con drop-shadow neon (`translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,255,163,0.15)]`).
- **`@utility fusion-card`**: Background card + border subtle + rounded-lg.
- **`@utility text-neon`**: Drop-shadow del colore primary.

## 4. Pattern UI Mobile-First
- **Touch Targets**: Minimo 44x44px per bottoni interattivi.
- **Input Numerici**: Usa sempre `inputMode="decimal"` o `numeric` per tastiere immediate (es. pesi e RIR).
- **Navigazione**: Bottom bar su mobile con FAB centrale per azioni principali.
- **Containers**: Nessuno scroll orizzontale in body.

## 5. Componenti Core & Pattern Avanzati
- **Shadcn/ui**: Base per tutti i componenti atomici (`Button`, `Card`, ecc).
- **Drawers / Sheets**: Per configurazioni complesse o modifiche multi-step su mobile, **prediligi i Drawers o Sheets rispetto ai normali Dialogs**, per offrire una migliore UX "bottom-up" esplorabile.
- **Detail Popups**: Per informazioni secondarie o storiche rapide (es. storico performance), usa `Dialog` leggeri o popover triggerati da icone, evitando di sovraccaricare la view principale.
- **Liste Drag-and-Drop**: Utilizza `@dnd-kit/core` e `sortable` per configurazioni di liste visive (esercizi, set).
- **Explicit Labels**: Evitare abbreviazioni criptiche (es. preferire "RIR 2" a "R2") per garantire chiarezza.
- **Notifiche**: `sonner` per toast actions.
- **Charts**: `recharts` per dashboard e trend (colore neon `#13ec6d`).
