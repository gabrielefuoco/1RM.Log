# Design System Specification (Global)

> [!IMPORTANT]
> This is the Single Source of Truth for the application's visual design. All pages must adhere to these tokens, overriding inconsistent values found in individual mockups.

## 1. Visual Identity

### Color Palette
- **Primary (Neon Green)**: `#13ec6d` (HSL: `145 85% 50%`)
  - **Usage**: Main CTA buttons, Active States, PR Highlights, Progress Bars.
  - **Do NOT use**: Emerald (`#10b981`) or other greens found in inconsistent mockups.
- **Background Dark**: `#102218` (HSL: `147 36% 10%`) - Deep Forest/Black.
- **Background Light**: `#f6f8f7` (HSL: `150 7% 97%`) - Off-white.
- **Surface/Card**: 
  - Glass: `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(10px)`.
  - Solid: `#162a1e` (Darker Green/Grey).
- **Text**:
  - Headings: `#ffffff`.
  - Body: `rgba(255,255,255,0.7)`.
  - Muted: `rgba(255,255,255,0.4)`.

### Typography
- **Family**: `Lexend` (Google Font).
- **Scale**:
  - `text-3xl`: Page Titles.
  - `text-xs uppercase tracking-widest`: Labels/Badges.

## 2. Common Components

### Buttons
- **Primary**: `bg-[#13ec6d] text-[#102218] font-bold uppercase rounded-xl`.
- **Secondary/Glass**: `bg-white/5 border border-white/10 text-white rounded-xl`.

### Glassmorphism
- Standard Class: `.glass-card`
- Border: `border-white/5` (Dark mode) or `border-slate-200` (Light mode).
