# Page Specification: Program Management

**Mockup Source (Macrociclo)**: [program_overview](../../mockup/program_overview_(macrociclo)/code.html)
**Mockup Source (Template Summary)**: [workout_template_summary](../../mockup/workout_template_summary/code.html)

## Overview
Manages the user's Training Structure.
> [!NOTE]
> Colors in this spec have been normalized to match the Global Design System (Neon Green `#13ec6d`), overriding any Emerald Green tones found in the specific mockups.

## UI Components - Program Overview

### 1. Active Program Card
- **Theme**: Dark Forest Green (`bg-[#102218]` or glass).
- **Status Badge**: `bg-primary/20 text-primary` ("In Corso").
- **Progress Bar**: 
  - Fill: **Neon Green** (`bg-primary`).
  - Track: Dark Green/Grey (`bg-white/10`).
- **Actions**: `bg-primary text-background-dark` (Edit).

### 2. Workout Templates List
- **Cards**: Dark Surface (`bg-white/5` or `#162a1e`). Border `border-white/5`.
- **Icon Box**: `bg-primary/10 text-primary`.
- **Hover State**: `border-primary/40`.

## UI Components - Template Summary

### 1. Stats Grid
- **Container**: `bg-white/5 border border-white/5 rounded-2xl p-5`.
- **Text**: White numbers, muted labels.
- **Muscle Tags**: `bg-primary/10 text-primary border-primary/20`.

### 2. Exercise Sequence List
- **Component**: `bg-white/5 border border-white/5 rounded-2xl`.
- **Headers**: White text.
- **Sets Rows**:
  - **Standard**: `bg-transparent`.
  - **Set Number**: `text-primary font-bold`.
  - **RIR Target**: `font-bold text-primary` (e.g., RIR 1).
  - **Failure**: `text-rose-500` (RIR 0).

### 3. Bottom Actions
- **Save Template**: Full width (or flex-3) **Neon Green** Button (`bg-primary text-background-dark`).
- **Add Exercise**: Outline/Glass button.
