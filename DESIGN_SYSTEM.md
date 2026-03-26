# Hommes Estates Design System

## Design Philosophy

**Light-Forward Luxury** - A premium, accessible design system that prioritizes bright, spacious aesthetics with copper accent sophistication.

### Core Principles

1. **Light-Forward, Luxe Accents**
   - Use mostly light or neutral backgrounds
   - Reserve true black (#000000) only for micro-areas needing absolute contrast
   - Prefer warm neutrals and very dark charcoal for UI elements

2. **Copper Accent as Signature**
   - #CC5500 is the primary accent color
   - Use for CTAs, micro-animations, borders, and subtle gradients
   - Combine with warm neutrals (ivory/off-white) for premium feel

3. **Generous Negative Space**
   - Large gutters and roomy hero sections
   - Oversized headings for luxury feel
   - Let content breathe

4. **Micro-Motion that Informs**
   - Animations clarify actions, not distract
   - Use motion for emphasis (hover, reveal, transitions)
   - No background noise animations

5. **High Fidelity Imagery**
   - Premium, high-res, business-suite focused
   - Boardrooms, glass façades, executive lobbies
   - Model office interiors

6. **Accessibility & Reduced Motion**
   - Respect `prefers-reduced-motion`
   - Ensure WCAG AA color contrast
   - Keyboard navigation support

---

## Color Palette & Tokens

### Light Mode (Default)

```css
--bg: #FFFFFF           /* Main background */
--surface: #FBFAF8      /* Cards and sections */
--muted: #F3F4F6        /* Subtle surfaces */
--text: #0F1722         /* Very dark charcoal text */
--accent: #CC5500       /* Copper primary */
--accent-2: #E07A2A     /* Lighter copper for gradients */
--charcoal: #111827     /* Only where dark BG needed */
--border: rgba(16,24,40,0.06)
```

### Dark Mode

```css
--bg: #0B0D0F           /* Deep charcoal - avoid pure black */
--surface: #111317      /* Card background */
--muted: #1A1D23        /* Muted surfaces */
--text: #F4F6F8         /* Light text */
--border: rgba(244,246,248,0.08)
/* Accent stays same (#CC5500) with subtle glow */
```

### Usage Guidelines

- **Backgrounds**: Use `--bg` for page, `--surface` for cards
- **Text**: Primary text uses `--text`, secondary uses `--text/70` opacity
- **Accents**: CTAs, links, highlights use `--accent`
- **Avoid Pure Black**: Use `--charcoal` instead of `#000000` for large surfaces
- **Copper Gradient**: `linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)`

---

## Typography

### Font Pairing (Option A - Modern Minimal)

**Recommended for clean, elegant aesthetic**

```css
font-family: {
  heading: 'Manrope',      /* Geometric, elegant */
  body: 'Inter',           /* High legibility */
  accent: 'Montserrat'     /* CTA / Accent text */
}
```

### Font Sizes

```css
hero: clamp(3rem, 8vw, 4rem)      /* 48-64px */
h1:   clamp(2.5rem, 6vw, 3.5rem)  /* 40-56px */
h2:   clamp(2rem, 4vw, 2.5rem)    /* 32-40px */
h3:   clamp(1.5rem, 3vw, 2rem)    /* 24-32px */
body: 1rem (16px)
small: 0.875rem (14px)
```

### Usage Examples

```tsx
<h1 className="text-hero font-heading font-bold">
  Elevate Your Business
</h1>

<p className="text-lg font-body text-text/70">
  Body copy with 70% opacity for hierarchy
</p>

<button className="font-accent font-semibold">
  Schedule Tour
</button>
```

---

## Spacing & Layout

### Spacing Scale

```
18: 4.5rem (72px)
22: 5.5rem (88px)
26: 6.5rem (104px)
30: 7.5rem (120px)
```

### Section Padding

```tsx
<section className="py-24 px-6">      {/* Desktop */}
<section className="py-16 px-4">      {/* Mobile */}
```

### Container Widths

```tsx
max-w-7xl    /* 1280px - Main content */
max-w-4xl    /* 896px - Article content */
max-w-2xl    /* 672px - Forms */
```

---

## Animation Patterns

### Framer Motion Standard Pattern

```tsx
const variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 120,
      damping: 20
    } 
  }
}

<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={variants}
>
  {content}
</motion.div>
```

### Standard Animations

1. **Hero Parallax**
   ```tsx
   // Slow scroll background
   background-attachment: fixed
   // + tiny translateY via scroll listener
   ```

2. **Card Hover (3D Tilt)**
   ```tsx
   whileHover={{ 
     scale: 1.05,
     rotateX: 2,
     rotateY: 2,
     transition: { duration: 0.3 }
   }}
   style={{ perspective: 1000 }}
   ```

3. **CTA Micro-interaction**
   ```tsx
   // Copper gradient flows left→right on hover
   // + tiny particles/bokeh pulse behind
   ```

4. **Scroll Reveal (Stagger)**
   ```tsx
   <motion.div
     variants={staggerContainer}
     initial="hidden"
     whileInView="visible"
   >
     {items.map((item, i) => (
       <motion.div key={i} variants={staggerItem}>
         {item}
       </motion.div>
     ))}
   </motion.div>
   ```

### Reduced Motion

```tsx
// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Patterns

### CTA Button (Primary)

```tsx
<button className="
  px-8 py-4 
  bg-copper-gradient 
  text-white 
  rounded-xl 
  font-accent font-semibold
  hover:shadow-2xl 
  hover:scale-105 
  transition-all duration-300
  focus:ring-2 focus:ring-accent focus:ring-offset-2
">
  Explore Executive Suites
</button>
```

### CTA Button (Secondary)

```tsx
<button className="
  px-8 py-4 
  border-2 border-accent 
  text-accent 
  rounded-xl 
  font-accent font-semibold
  hover:bg-accent 
  hover:text-white 
  transition-all duration-300
">
  Download Brochure
</button>
```

### Card Component

```tsx
<motion.div
  whileHover={{ scale: 1.03, y: -5 }}
  className="
    bg-white dark:bg-charcoal
    rounded-3xl 
    p-8 
    shadow-lg 
    hover:shadow-2xl
    transition-shadow duration-300
  "
>
  {content}
</motion.div>
```

### Input Field (with Floating Label)

```tsx
<div className="relative">
  <input
    type="text"
    id="name"
    className="
      peer
      w-full px-4 pt-6 pb-2
      bg-surface
      border-2 border-border
      rounded-lg
      focus:border-accent
      focus:ring-2 focus:ring-accent/20
      transition-all
    "
    placeholder=" "
  />
  <label
    htmlFor="name"
    className="
      absolute left-4 top-2
      text-sm text-text/60
      peer-placeholder-shown:top-4
      peer-placeholder-shown:text-base
      peer-focus:top-2
      peer-focus:text-sm
      peer-focus:text-accent
      transition-all
    "
  >
    Full Name
  </label>
</div>
```

---

## Interactive Features

### 1. Partner Logo Marquee

**Behavior:**
- Auto-scroll at 40-60px/s
- Pause on hover/focus
- Logos grayscale by default, colored on hover
- Copper overlay for uniform look
- Keyboard accessible

**Implementation:**
```tsx
// See: src/components/home/PartnerMarquee.tsx
```

### 2. Investment Calculator

**Features:**
- Live sliders for purchase price, rent, occupancy
- Animated numeric counters
- Real-time yield calculations
- Download investment pack CTA
- 5-year projection chart

**Implementation:**
```tsx
// See: src/components/home/InvestmentCalculator.tsx
```

### 3. Interactive Floor Plan

**Future Implementation:**
- SVG overlay with clickable suite hotspots
- Mini-panels showing: status, price, area, 3D view
- Filter by availability
- Deep linking to specific units
- `?unit=FUSE-W-101` route support

---

## Navigation Patterns

### Sticky Header

```tsx
// Sticky top bar with blur on scroll
<header className="
  sticky top-0 z-50
  bg-bg/80 
  backdrop-blur-lg
  border-b border-border
  transition-all duration-300
">
  {/* Logo compresses slightly on scroll */}
</header>
```

### Mobile Menu

```tsx
// Full-screen panel with animated menu tiles
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-bg z-50"
    >
      {/* Animated menu items */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Performance Checklist

### Images
- ✅ Responsive srcset
- ✅ WebP format
- ✅ Lazy loading
- ✅ Placeholder blur

### Fonts
- ✅ Host locally or preconnect
- ✅ Preload critical fonts
- ✅ Variable fonts for weight transitions

### CSS
- ✅ Critical CSS inline for hero
- ✅ Async load rest
- ✅ Purge unused

### JavaScript
- ✅ Code-split by route
- ✅ Hydrate interactive parts only
- ✅ Lazy load below-fold components

### Lighthouse Targets
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

---

## Accessibility Standards

### Keyboard Navigation
- All modals: ESC to close
- All carousels: Arrow keys
- All forms: Tab order logical

### Color Contrast
- Test #CC5500 on #FFFFFF → Pass AA ✓
- Test #CC5500 on dark backgrounds → Add outline
- Links: Underline or 3:1 contrast with surrounding text

### Screen Readers
- Semantic HTML
- ARIA labels on custom controls
- Alt text on all images
- Live regions for dynamic content

### Focus States
```tsx
focus:ring-2 focus:ring-accent focus:ring-offset-2
focus:outline-none
```

---

## Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Usage
```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3
  gap-6
">
```

---

## Z-Index Scale

```
z-0:    Base layer
z-10:   Overlay masks, decorative elements
z-20:   Content sections
z-30:   Floating elements (sticky CTA)
z-40:   Dropdowns, tooltips
z-50:   Navigation, modals
z-[100]: Notifications, toasts
```

---

## File Organization

```
src/
├── components/
│   ├── home/          # Homepage sections
│   ├── layout/        # Header, Footer
│   ├── ui/            # Reusable UI elements
│   └── providers/     # Context providers
├── app/               # Next.js pages
├── lib/               # Utilities, API client
├── hooks/             # Custom React hooks
├── types/             # TypeScript definitions
└── styles/            # Global CSS
```

---

## Code Style Guide

### Component Structure
```tsx
'use client' // If uses hooks/interactivity

import { useState } from 'react'
import { motion } from 'framer-motion'
// ... other imports

interface ComponentProps {
  // TypeScript props
}

export function ComponentName({ prop }: ComponentProps) {
  // Hooks
  const [state, setState] = useState()
  
  // Derived values
  const computed = useMemo(() => {}, [])
  
  // Event handlers
  const handleClick = () => {}
  
  // Render
  return (
    <motion.div>
      {/* Component JSX */}
    </motion.div>
  )
}
```

### Naming Conventions
- Components: PascalCase (`HeroSection.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Constants: SCREAMING_SNAKE (`MAX_ITEMS`)
- CSS Classes: kebab-case in Tailwind

---

## Testing Guidelines

### Visual Regression
- Test light/dark mode transitions
- Test responsive breakpoints
- Test hover/focus states

### Interaction Testing
- Forms submit correctly
- Navigation works
- Modals open/close
- Carousels scroll

### Performance Testing
- Lighthouse CI on every deploy
- Bundle size tracking
- Image optimization verification

---

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Last 2 versions

### Graceful Degradation
- CSS Grid → Flexbox fallback
- CSS Variables → Hard-coded colors
- Animations → Static if `prefers-reduced-motion`

---

## Quick Reference

### Common Classes

```tsx
// Section Container
className="py-24 px-6 max-w-7xl mx-auto"

// Card
className="bg-white dark:bg-charcoal rounded-3xl p-8 shadow-lg"

// Heading
className="text-h1 font-heading font-bold text-text"

// Body Text
className="text-lg font-body text-text/70"

// CTA Button
className="px-8 py-4 bg-copper-gradient text-white rounded-xl font-accent font-semibold hover:shadow-2xl hover:scale-105 transition-all"

// Input
className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20"
```

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Maintained by:** Hommes Estates Development Team
