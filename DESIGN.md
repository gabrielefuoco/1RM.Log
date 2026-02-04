# Design System: 1RM.Log 2.0 (Industrial Jungle)
**Project ID:** 5740851858920516318

## 1. Visual Theme & Atmosphere
The "Industrial Jungle" theme combines a deep, organic black background with vibrant, electric mint accents. It feels high-performance, raw, and modern—like a cyberpunk gym. The interface uses glassmorphism ("Glass Header/Nav") and subtle grid textures to add depth without clutter. The vibe is "Softened Brutalist": bold typography and high contrast, but with accessible rounded corners and smooth transitions.

## 2. Color Palette & Roles
*   **Electric Mint (#00ffa3):** The primary brand color. Used for "Text Neon" effects, active rings, and key call-to-actions. It glows against the dark background.
*   **Deep Organic Black (#020a07):** The application background. Darker than standard gray, providing a rich canvas.
*   **Dark Jungle Green (#0a1f18):** Used for Cards and Popovers. A very dark green-tinted charcoal.
*   **Emerald 500 (#10b981):** Secondary accent color, used for borders (at low opacity) and muted foregrounds.
*   **White (#ffffff):** Primary text and foreground elements for maximum legibility.
*   **Emerald Border (#10b98133):** Subtle 20% opacity emerald used for dividers and inputs.

## 3. Typography Rules
*   **Font Family (Headings):** **Oswald**. Uppercase, tracking-wide. Used for h1-h6 to give a strong, athletic structure.
*   **Font Family (Body):** **Inter**. Clean, legible sans-serif for UI elements and data.
*   **Font Family (Mono):** **JetBrains Mono**. Used for technical data or time displays.

## 4. Component Stylings
*   **Buttons/Actions:**
    *   Primary: Electric Mint background with Black text.
    *   Effects: `drop-shadow-[0_0_10px_#00ffa366]` (Neon Glow).
*   **Cards (Fusion Card):**
    *   Background: `#0a1f18`
    *   Border: 1px solid `#10b98133`
    *   Hover: Glows with Primary color and slight lift (`-translate-y-[2px]`).
*   **Glass Elements:**
    *   Headers and Navs use `bg-background/80` with `backdrop-blur-2xl` and a subtle gradient border.

## 5. Layout Principles
*   **Grid Texture:** Background features a 40px linear gradient grid for texture.
*   **Roundness:** `rounded-lg` (0.5rem / 8px).
*   **Mobile First:** Large touch targets (`min-h-[44px]`), "Fusion Cards" separate content clearly on small screens.
