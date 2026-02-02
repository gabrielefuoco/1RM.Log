# Logica di Allenamento - 1RM Logbook

> [!IMPORTANT]
> **REGOLE DI AUTO-AGGIORNAMENTO**: Aggiorna questo file ogni volta che la formula di calcolo 1RM viene modificata, quando cambiano i parametri dell'algoritmo di progressione o se vengono introdotti nuovi indici di performance.

## 1. Il Cervello: Calcolo 1RM
Non chiediamo mai l'1RM all'utente; lo stimiamo in base alle performance.
- **Formula**: Epley (`weight * (1 + reps/30)`).
- **Implementazione**:
  - Centralizzata in `utils/formulas.ts`.
  - Ridondata nel DB come `GENERATED ALWAYS` column in `exercise_logs`.
- **Precisione**: Arrotondamento a 1 decimale. Se `reps == 1`, l'1RM è pari al peso sollevato.

## 2. Algoritmo di Progressione
La progressione è gestita in `services/progression.ts`. Suggerisce il carico per il prossimo set basandosi su:

### A. RIR (Reps In Reserve)
- **Logica**: Se `RIR_Effettivo >= RIR_Target + 2`.
- **Azione**: Suggerisci aumento del carico.
- **Incremento**: `Peso_Attuale * (1 + progression_rate)`. Default rate: 2.5%.

### B. Rep Range Overflow
- **Logica**: Se `Reps_Effettive > Reps_Target_Max`.
- **Azione**: Suggerisci aumento del carico.

### C. Gestione dei Fallimenti
- **Logica**: Se `RIR_Effettivo < 0` (cedimento tecnico o assistito).
- **Azione**: Suggerisci Mantenimento o Scarico (`deload_rate` default 10%).

## 3. Arrotondamento Carichi
- **Standard**: Tutti i pesi suggeriti sono arrotondati al **2.5kg** più vicino (passo standard di 1.25kg per lato del bilanciere).
- **Funzione**: `ProgressionCalculator.roundToPlate()`.

## 4. Intensità Soggettiva
- **Conversione**: Usiamo `10 - RIR` per mappare internamente il RIR in RPE se necessario per i grafici.
