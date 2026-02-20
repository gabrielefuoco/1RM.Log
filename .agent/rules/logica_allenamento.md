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

## 2. Progression Engine (Il Motore di Crescita)
Il sistema di suggerimento carichi è stato evoluto in un "Progression Engine" deterministico.

### A. Modalità di Progressione
Ogni esercizio in una scheda può avere una modalità specifica:

#### 1. Double Progression (`auto_double`)
-   **Obiettivo**: Aumentare il volume (Rep) prima dell'intensità (Peso).
-   **Logica**:
    1.  Hai completato TUTTI i set con il massimo delle ripetizioni (`reps_max`)?
    2.  **SÌ**: Aumenta il peso (`increment` es. +2.5kg) e resetta le ripetizioni al minimo (`reps_min`).
    3.  **NO**: Mantieni il peso e prova a fare più ripetizioni la prossima volta.

#### 2. Linear Progression (`auto_linear`)
-   **Obiettivo**: Aumentare l'intensità linearmente finché la tecnica regge.
-   **Logica (RIR Based)**:
    1.  Il RIR dell'ultimo set era troppo alto (`RIR_Effettivo >= RIR_Target + 2`)?
    2.  **SÌ**: Era troppo facile -> Aumenta peso (`increment`).
    3.  **NO**: Mantieni peso.
    4.  **Eccezione**: Se `Reps > Reps_Max + 2` (Overshoot), aumenta peso.

#### 3. Custom Sequence (`custom_sequence`)
-   **Obiettivo**: Periodizzazione ondulatoria o schemi fissi (es. 5/3/1, Waves).
-   **Logica**: Segue una lista predefinita di step (es. Settimana 1: 70%, Settimana 2: 75%...).
-   **Avanzamento**: Manuale o automatico a fine mesociclo.

### B. Gestione dei Back-off Set
Quando si aggiungono serie di back-off e si riordinano le serie:
-   **Natura "Slot-Based"**: Le proprietà di back-off (`is_backoff`, `backoff_percent`) non appartengono al singolo set fisico trascinato col DND, ma rimangono ancorate alla posizione (Slot) in cui si trovavano. Spostare un set normale al fondo (dove prima c'era un back-off) non sposterà lo status di back-off in alto, ma farà diventare back-off il set spinto verso il fondo.
-   **Sicurezza**: Il primo set (indice 0) non può mai essere un set di back-off (viene castato a `false` forzatamente).
-   **Weight Mode Sync**: abilitare il backback-off forza il `weight_mode` a `percent`.

### C. Carryover Intra-Sessione
-   Se l'utente modifica il peso nel Set 1, il suggerimento per i Set successivi si adatta immediatamente ("Live Carryover").

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
