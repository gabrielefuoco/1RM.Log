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

## 3. Tailwind CSS v4 & Utility
Utilizziamo Tailwind v4 con plugin `tailwindcss-animate`.
### Utility Personalizzate (in `globals.css`):
- `@utility fusion-card`: Background card + border subtle + rounded-lg.
- `@utility fusion-card-hover`: Effetto hover con shadow neon e traslazione 2px.
- `@utility text-neon`: Drop-shadow del colore primary.

## 4. Pattern UI Mobile-First
- **Touch Targets**: Minimo 44x44px per bottoni interattivi.
- **Input Numerici**: Usa sempre `inputMode="decimal"` o `numeric` per tastiere immediate.
- **Navigazione**: Bottom bar su mobile con FAB centrale per azioni principali.

## 5. Componenti Core & Pattern Avanzati
- **Shadcn/ui**: Base per tutti i componenti atomici (Button, Card, Dialog).
- **Detail Popups**: Per informazioni secondarie o storiche (es. Target/Last performance), usa un `Dialog` triggerato da badge cliccabili invece di sovraffollare la UI principale.
- **Explicit Labels**: Evitare abbreviazioni criptiche (es. preferire "RIR 2" a "R2") per garantire chiarezza immediata sotto sforzo intenso.
- **Sonner**: Per notifiche toast.
- **Recharts**: Per grafici (colore neon `#13ec6d`).
