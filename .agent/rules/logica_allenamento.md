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

## 2. Suggerimenti e Carryover
La progressione e i suggerimenti di carico sono gestiti per massimizzare la velocità di input in palestra.

### A. Carryover Intra-Sessione (Live Carryover)
Quando un utente completa il Set 1, i dati di peso e reps vengono automaticamente portati come suggerimento al Set 2 della **stessa sessione**.
- **Priorità**: Sessione Corrente > Ultima Sessione Storica.
- **Obiettivo**: Ridurre l'inserimento manuale se l'utente mantiene lo stesso carico per più serie.

### B. Algoritmo di Progressione (Storico)
Suggerisce il carico iniziale basandosi sulla performance dell'ultima sessione:

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

## 4. Intensità Soggettiva (RIR vs RPE)
- **Dual Mode**: L'utente può scegliere tra RIR (Reps In Reserve) e RPE (Rate of Perceived Exertion).
- **Storage**: Il database salva sempre e solo il **RIR** per consistenza algoritmica.
- **Mapping**: 
  - `RPE = 10 - RIR`
  - `RIR = 10 - RPE`
- **Display**: L'UI converte al volo in base alla preferenza `intensity_type` dell'utente.

## 5. Analisi & Competizione
Calcolo automatico dei punteggi relativi (Powerlifting) per confrontare atleti di peso diverso.

### A. Metriche Supportate
1. **DOTS**: Standard moderno (BPU, GPA). Considera il peso corporeo e il sesso.
2. **IPF GL**: Punteggio ufficiale International Powerlifting Federation (Classic).
3. **Wilks**: Standard storico (ancora diffuso).

### B. Regole di Calcolo
- **Total**: Somma dei migliori `estimated_1rm` storici di Squat, Bench e Deadlift.
- **Peso Corporeo**: Usa il peso registrato più vicino alla data del lift (o l'ultimo disponibile).
- **Sesso**: Coefficienti differenziati per Maschi (`male`) e Femmine (`female`).
