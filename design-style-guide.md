# TPAPOS — Design Style Guide

> Dark mode: FIXED DARK — this project does NOT support light mode. No `.dark` class toggling. No ThemeProvider. Apply all dark values directly to `:root` in globals.css.

---

## Visual Reference

The reference shot is a dark enterprise analytics dashboard ("Revenue") with a deep navy-black background, vivid violet-purple as the dominant accent color, and heavy sans-serif typography at display weight. Stat cards sit on slightly lighter dark surfaces with near-invisible 1px borders, creating depth through tonal layering rather than shadows. The area chart uses a purple gradient fill that fades to transparent, and bar charts use solid violet bars with rounded tops. Status indicators use small colored dots (amber for processing, green for delivered). The nav sidebar is flush dark with the active item receiving a filled purple block. Buttons are softly rounded rectangles — outlined ghost style for secondary actions, filled purple for primary. The overall energy is: **enterprise-dark · violet-tech · data-rich** — the kind of dashboard that makes a business owner feel in control the moment they open it.

---

## 1. Color Palette

```css
@theme {
  /* === BACKGROUNDS === */
  --color-bg-base:        #0B0B18;   /* deepest bg — root, sidebar */
  --color-bg-surface:     #11111F;   /* card surfaces, modals */
  --color-bg-elevated:    #18182C;   /* hover states, dropdowns, table rows */
  --color-bg-overlay:     #1E1E32;   /* input fields, code blocks */

  /* === PRIMARY — VIOLET PURPLE === */
  --color-primary:        #7C3AED;   /* main brand purple */
  --color-primary-hover:  #6D28D9;   /* button hover */
  --color-primary-muted:  #4C1D95;   /* active nav fill, subtle highlights */
  --color-primary-faint:  #2D1B69;   /* very subtle bg tint on selected rows */
  --color-primary-glow:   rgba(124, 58, 237, 0.25); /* glow / ring effect */

  /* === ACCENTS === */
  --color-accent-violet:  #8B5CF6;   /* secondary charts, icons */
  --color-accent-indigo:  #6366F1;   /* tertiary charts */
  --color-accent-teal:    #14B8A6;   /* donut chart segment, success states */
  --color-accent-amber:   #F59E0B;   /* warning, processing status */
  --color-accent-rose:    #F43F5E;   /* error, danger, out-of-stock */
  --color-accent-emerald: #10B981;   /* success, delivered status, in-stock */
  --color-accent-gold:    #EAB308;   /* donut chart segment */

  /* === TEXT === */
  --color-text-primary:   #F1F0FF;   /* headings, display numbers */
  --color-text-secondary: #A09EC0;   /* labels, captions, nav items */
  --color-text-muted:     #5C5A7A;   /* placeholder text, disabled */
  --color-text-inverse:   #0B0B18;   /* text on filled purple buttons */

  /* === BORDERS === */
  --color-border-subtle:  rgba(255, 255, 255, 0.06);  /* card borders */
  --color-border-default: rgba(255, 255, 255, 0.10);  /* input borders */
  --color-border-strong:  rgba(255, 255, 255, 0.18);  /* focused input, dividers */
  --color-border-purple:  rgba(124, 58, 237, 0.40);   /* focused purple ring */
}
```

### Usage Rules
- **Never** use a white or light background anywhere in the app
- Depth is created by stacking: `bg-base` → `bg-surface` → `bg-elevated` → `bg-overlay`
- Purple `#7C3AED` is used ONLY for interactive elements: active nav, primary buttons, chart fills, badges
- All chart fills: purple family (`#7C3AED`, `#8B5CF6`, `#6366F1`) with teal + gold for donut segments
- Status colors are always paired with a dot indicator (never text-only)

---

## 2. Typography

**Primary Font:** `Plus Jakarta Sans` (Google Fonts)
**Fallback:** `system-ui, -apple-system, sans-serif`

```css
@theme {
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;

  /* Display — stat card numbers, hero metrics */
  --font-size-display:    2.25rem;   /* 36px */
  --font-weight-display:  800;

  /* Heading 1 — page titles */
  --font-size-h1:         1.875rem;  /* 30px */
  --font-weight-h1:       700;

  /* Heading 2 — section titles, card headers */
  --font-size-h2:         1.25rem;   /* 20px */
  --font-weight-h2:       600;

  /* Heading 3 — sub-section labels */
  --font-size-h3:         1rem;      /* 16px */
  --font-weight-h3:       600;

  /* Body — default text */
  --font-size-body:       0.875rem;  /* 14px */
  --font-weight-body:     400;

  /* Small / Label */
  --font-size-small:      0.75rem;   /* 12px */
  --font-weight-small:    500;

  /* Caption / Muted */
  --font-size-caption:    0.6875rem; /* 11px */
  --font-weight-caption:  400;
}
```

### Typography Rules
- Stat card numbers (revenue, sales count) → display size, weight 800, `text-primary`
- Page titles → h1, weight 700, `text-primary`
- Card titles → h2, weight 600, `text-primary`
- Table column headers → small, weight 600, `text-secondary`, uppercase, tracking-wide
- Table body text → body, weight 400, `text-primary`
- Sidebar nav items → body, weight 500, `text-secondary`; active → weight 600, `text-primary`
- Captions, timestamps → caption, `text-muted`

---

## 3. Spacing & Layout

```css
@theme {
  --spacing-page-x:     1.5rem;    /* 24px horizontal page padding */
  --spacing-page-y:     1.5rem;    /* 24px vertical page padding */
  --spacing-card-p:     1.25rem;   /* 20px card internal padding */
  --spacing-section:    1.5rem;    /* 24px gap between page sections */
  --spacing-row-gap:    1rem;      /* 16px gap between stat card rows */
  --sidebar-width:      240px;     /* expanded sidebar */
  --sidebar-collapsed:  64px;      /* icon-only sidebar */
  --header-height:      60px;      /* page header height */
}
```

- **Grid system:** 12-column CSS grid for analytics pages; flex for forms and detail pages
- **Stat cards row:** 4-column grid on desktop → 2-col tablet → 1-col mobile
- **Chart layout:** Primary chart takes ~60% width, secondary chart ~38% (mirroring reference)
- **Sidebar:** Fixed left, full height, `z-50`. Collapsible — icon-only mode at `64px`
- **Content area:** `margin-left: var(--sidebar-width)`, transitions with sidebar collapse

---

## 4. Border Radius

```css
@theme {
  --radius-sm:    6px;    /* badges, status dots wrapper, small chips */
  --radius-md:    10px;   /* input fields, dropdowns, small cards */
  --radius-lg:    14px;   /* main cards, modals, chart containers */
  --radius-xl:    18px;   /* large feature cards, POS product cards */
  --radius-full:  9999px; /* pill buttons, tags, avatar, nav active item */
}
```

---

## 5. Shadows & Depth

No traditional box-shadows. Depth is created via:

```css
/* Card border — barely visible white line */
border: 1px solid var(--color-border-subtle);

/* Elevated card (hovered or selected) */
border: 1px solid var(--color-border-default);

/* Purple focus ring — inputs, focused elements */
box-shadow: 0 0 0 3px var(--color-primary-glow);

/* Subtle inner glow on active nav item */
box-shadow: inset 0 0 12px rgba(124, 58, 237, 0.15);

/* Chart container atmospheric glow (optional, use sparingly) */
box-shadow: 0 0 40px rgba(124, 58, 237, 0.08);
```

---

## 6. Components

### Stat Card
```
Background:   var(--color-bg-surface)
Border:       1px solid var(--color-border-subtle)
Radius:       var(--radius-lg)
Padding:      var(--spacing-card-p)
Layout:       label (small, secondary) → value (display, primary) → trend badge

Trend badge:
  - Positive: bg #10B981/15, text #10B981, "↑ 12.9%"
  - Negative: bg #F43F5E/15, text #F43F5E, "↓ 15.9%"
  - Badge radius: var(--radius-full), padding: 2px 8px
```

### Primary Button
```
Background:   var(--color-primary)        → hover: var(--color-primary-hover)
Text:         var(--color-text-inverse), weight 600
Radius:       var(--radius-md)
Padding:      10px 20px
Transition:   background 150ms ease, transform 100ms ease
Active:       scale(0.98)
Focus:        3px purple glow ring
```

### Secondary / Ghost Button
```
Background:   transparent
Border:       1px solid var(--color-border-default)
Text:         var(--color-text-secondary)  → hover text: var(--color-text-primary)
Radius:       var(--radius-md)
Padding:      10px 20px
Hover bg:     var(--color-bg-elevated)
```

### Input Field
```
Background:   var(--color-bg-overlay)
Border:       1px solid var(--color-border-default)
Radius:       var(--radius-md)
Padding:      10px 14px
Text:         var(--color-text-primary)
Placeholder:  var(--color-text-muted)
Focus border: var(--color-border-strong)
Focus ring:   3px var(--color-primary-glow)
Height:       42px
```

### Data Table
```
Container bg:    var(--color-bg-surface), radius var(--radius-lg), border subtle
Header row:      bg var(--color-bg-elevated), text secondary, weight 600, uppercase, tracking-widest, font-size 11px
Body row:        bg transparent → hover bg var(--color-bg-elevated)
Row border:      1px solid var(--color-border-subtle) between rows only (no outer border)
Cell padding:    12px 16px
Selected row:    bg var(--color-primary-faint), left border 2px var(--color-primary)
```

### Sidebar Nav Item
```
Default:      text secondary, padding 10px 16px, radius var(--radius-md)
Hover:        bg var(--color-bg-elevated), text primary
Active:       bg var(--color-primary), text white, weight 600
              box-shadow: inset 0 0 12px rgba(124,58,237,0.15)
Icon:         20px, mr-3, same color as text
```

### Status Badge (dot + label)
```
Layout:     flex items-center gap-2
Dot:        6px × 6px, border-radius full
Text:       small, weight 500

COMPLETED / Delivered:  dot #10B981 (emerald)
PENDING / Processing:   dot #F59E0B (amber)
VOIDED / Rejected:      dot #F43F5E (rose)
LOW STOCK:              dot #F59E0B (amber)
OUT OF STOCK:           dot #F43F5E (rose)
IN STOCK:               dot #10B981 (emerald)
CASH:                   dot #8B5CF6 (violet)
MTN MOMO:               dot #EAB308 (gold)
AIRTEL MONEY:           dot #F43F5E (rose/red — Airtel brand)
TRANSFER PENDING:       dot #6366F1 (indigo)
TRANSFER APPROVED:      dot #10B981 (emerald)
```

### Modal / Dialog
```
Overlay:    rgba(0,0,0,0.7), backdrop-blur-sm
Container:  bg var(--color-bg-surface), border subtle, radius var(--radius-xl)
            max-width 560px, padding 28px
Header:     h2 + close button (X icon, ghost)
Footer:     flex justify-end gap-3 (cancel ghost + confirm primary)
```

### Notification Bell
```
Icon:       Bell icon, 20px, text-secondary
Badge:      8px × 8px dot or number chip, bg var(--color-accent-rose), absolute top-0 right-0
Dropdown:   bg var(--color-bg-surface), border subtle, radius var(--radius-lg), shadow card
            min-width 320px, max-height 400px, overflow-y auto
Item:       unread → bg var(--color-primary-faint), left border 2px purple
            read → default row hover style
```

---

## 7. Chart Design (Recharts)

### Area Chart (Revenue)
```
Stroke:       #7C3AED, strokeWidth 2.5
Fill:         url(#purpleGradient) — gradient from #7C3AED at 40% opacity to transparent
Dot:          hidden by default, shown on hover (6px circle, fill #7C3AED, stroke white 2px)
Grid lines:   stroke #ffffff08, strokeDasharray "4 4"
Axis text:    fill #5C5A7A, fontSize 12
Tooltip:      bg #18182C, border 1px #7C3AED40, text-primary, radius 8px
```

### Bar Chart (Branch Sales Comparison)
```
Bar fill:     #7C3AED → hover #8B5CF6
Bar radius:   [4, 4, 0, 0] (rounded tops only)
Grid lines:   same as area chart
```

### Donut Chart (Payment Methods / Traffic)
```
Segments:     #7C3AED (Cash), #14B8A6 (MTN MoMo), #EAB308 (Airtel Money)
InnerRadius:  55%, creates donut hole
Center label: large number (percentage or total), bold 700
Legend:       dot + label, below or right of chart
```

### Multi-line Chart (Branch Comparison)
```
Line colors:  #7C3AED, #8B5CF6, #6366F1, #14B8A6 (one per branch)
strokeWidth:  2
```

---

## 8. POS Screen Design

The POS screen (`/cashier`) is full-screen and optimised for fast data entry:

```
Layout:       Two-panel flex row — Product Grid (left 60%) + Cart Panel (right 40%)

Product Grid:
  - Search bar at top (full width, dark input)
  - Category pill filters below search (scrollable horizontal)
  - Product cards: 3-column grid, bg-surface, border subtle, radius-lg
    - Product image (aspect-ratio 1/1, object-cover)
    - Product name (body, weight 600)
    - Price in UGX (h3, primary color)
    - "Add" button or tap anywhere → adds to cart

Cart Panel:
  - Fixed right panel, bg-surface, border-left border-subtle
  - Header: "Current Sale" + cashier name
  - Items list: product name, qty stepper (−/+), unit price, subtotal
  - Discount field: input with UGX prefix
  - Divider
  - Total: display size, weight 800, primary text
  - Payment method: 3 pill toggles (Cash / MTN MoMo / Airtel Money)
    Selected pill: bg primary, text white
  - "Complete Sale" button: full width, primary, large (48px height)
  - "Clear Cart" ghost button

UGX formatting: all prices formatted as "UGX 1,250,000" — no decimal places
```

---

## 9. Animations (Framer Motion)

```ts
// Page entrance — staggered fade up
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
}

// Stat card number count-up on mount
// Use a simple counter animation: 0 → value over 800ms, ease-out

// Chart entrance — bars/lines draw in on mount (Recharts isAnimationActive default)

// Sidebar collapse — width transition 200ms ease

// Modal — scale(0.96) opacity(0) → scale(1) opacity(1), 180ms ease-out

// Toast notifications — slide in from bottom-right, 200ms
```

**Rules:**
- Animate `transform` and `opacity` ONLY — never `height`, `width`, or layout properties
- No animation on every click — reserve for: page load, modal open/close, chart mount
- Sidebar collapse is the only persistent layout animation

---

## 10. Responsive Rules

| Breakpoint | Sidebar | Layout |
|---|---|---|
| `< 768px` (mobile) | Hidden, bottom nav or hamburger | Single column, full-width |
| `768px–1024px` (tablet) | Collapsed (icon-only, 64px) | 2-col grids |
| `> 1024px` (desktop) | Expanded (240px) | Full grid layouts |

- Stat cards: 4-col → 2-col → 1-col
- POS screen: side-by-side on desktop, stacked (products top, cart bottom) on mobile
- Charts: full width on mobile, side-by-side on desktop
- Data tables: horizontal scroll on mobile with sticky first column

---

## 11. Loading Skeletons

All skeletons use a shimmer animation on dark surfaces:

```css
/* Skeleton base */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-elevated) 25%,
    var(--color-bg-overlay) 50%,
    var(--color-bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Skeleton patterns:**
- Stat card: 4× cards with `h-[100px]` skeleton blocks
- Chart: `h-[280px]` full-width skeleton block
- Table: header row + 8× row skeletons (alternating opacity)
- Product card: image square + 2 text lines

---

## 12. Empty States

```
Container:    centered flex col, padding 48px, text-center
Icon:         48px, text-muted (ghost/outline icon variant)
Title:        h3, text-secondary, weight 600
Subtitle:     body, text-muted, max-width 280px
CTA button:   primary (if actionable) or omit
```

Examples:
- No sales today: inbox icon, "No sales recorded today", "Transactions will appear here once you start selling"
- No stock: package icon, "No products in stock", "Record a stock entry to get started"
- No messages: message-circle icon, "No messages yet"

---

## 13. Status & Alert Banners

```
Low stock alert bar (top of inventory pages):
  bg: rgba(245, 158, 11, 0.12)
  border-left: 3px solid #F59E0B
  text: #F59E0B weight 500
  icon: AlertTriangle 16px

Error banner:
  bg: rgba(244, 63, 94, 0.12)
  border-left: 3px solid #F43F5E

Success toast:
  bg: var(--color-bg-elevated)
  border: 1px solid #10B981
  icon: CheckCircle, text-emerald
  position: bottom-right, fixed
```

---

## 14. Landing Page Design

Dark marketing page consistent with the dashboard aesthetic:

- **Hero:** Full-width dark section, `bg-base`. Bold headline (h1 display, 800 weight): "Run Every Branch. Own Every Sale." Purple gradient text on key word. Sub-headline in text-secondary. Two CTAs: "Request a Demo" (primary) + "See How It Works" (ghost). Abstract purple glow orb in background (CSS radial gradient, blurred).
- **Features section:** 3-column card grid. Each card: dark surface bg, subtle border, icon in purple, title h2, description body-secondary. Cards fade-up on scroll (Framer Motion).
- **Roles section:** 4 role cards (Admin, Manager, Cashier, Store Manager). Each with role icon, role name, and 3 bullet features. Highlight the user's "role" on hover with purple border.
- **Social proof / stats bar:** "50+ businesses · 200+ branches · 1M+ transactions processed" — large numbers in primary color, labels in secondary.
- **CTA footer band:** Dark purple tint band (`bg-primary-faint`), "Ready to modernise your business?" + "Contact Us" button.
- **Footer:** Logo + tagline, nav links, "Made with ❤️ in Uganda 🇺🇬".

---

## 15. Iconography

Use `lucide-react` throughout. Size guidelines:
- Sidebar nav icons: `20px` (w-5 h-5)
- Stat card icons: `20px`, color `text-muted` or match accent
- Action buttons: `16px` (w-4 h-4) inline with text
- Empty state icons: `48px` (w-12 h-12), `text-muted`
- Alert icons: `16px`
- Notification bell: `20px`

Key icons to use:
- Dashboard: `LayoutDashboard`
- Branches: `Building2`
- Users: `Users`
- Products: `Package`
- Inventory: `Warehouse`
- Sales: `ShoppingCart`
- Analytics: `BarChart3`
- Reports: `FileText`
- Messages: `MessageCircle`
- Notifications: `Bell`
- Settings: `Settings`
- Suppliers: `Truck`
- Transfers: `ArrowLeftRight`
- Export: `Download`
- POS: `Monitor`

---

## 16. UGX Currency Formatting

All monetary values are in Ugandan Shillings (UGX). No decimal places.

```ts
// lib/format.ts
export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
}
// Output: "UGX 1,250,000"
```

- Stat cards: full format "UGX 1,250,000"
- Table cells: abbreviated for very large numbers "UGX 1.25M" (optional)
- POS screen: full format, large display
- Chart Y-axis: abbreviated "1.25M" or "250K" without UGX prefix
- Chart tooltips: full format with UGX prefix
