# Design System Strategy: The Serene Authority

## 1. Overview & Creative North Star
The design system for **(RE)Sources Relationnelles** is guided by the Creative North Star: **"The Serene Authority."** 

In the context of government health, "sober" does not mean "sterile." We are moving away from the rigid, boxed-in layouts of traditional administration and toward a high-end editorial experience. This system balances the weight of institutional trust with the lightness of modern wellness. We achieve this through **intentional asymmetry**, massive breathing room (negative space), and **Tonal Layering** rather than structural lines. The goal is to make the user feel held, not processed.

---

## 2. Colors: The Depth of Trust
We utilize a sophisticated palette of blues and neutrals. To achieve a premium feel, we strictly follow two core architectural rules:

### The "No-Line" Rule
Standard UI relies on 1px borders to separate content. In this system, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts. Use `surface-container-low` for large section backgrounds and `surface` or `surface-container-lowest` for the primary canvas. This creates a seamless, fluid interface that feels "carved" rather than "assembled."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material tiers to define importance:
- **Base Layer:** `surface` (#f8f9fa)
- **Sectioning Layer:** `surface-container-low` (#f1f4f5) to create distinct content zones.
- **Interactive Layer:** `surface-container-lowest` (#ffffff) for cards and primary floating elements to create a natural "lift."
- **Focus Layer:** `surface-container-high` (#e5e9eb) for subtle inset elements like search bars or secondary navigation.

### Signature Textures
To avoid a flat "government template" look:
- **CTAs:** Use a subtle linear gradient from `primary` (#0356d5) to `primary-container` (#3f78f7) at a 135-degree angle. This provides a "jewel-like" depth to buttons.
- **Glassmorphism:** For mobile navigation bars or sticky headers, use `surface` at 80% opacity with a `backdrop-filter: blur(12px)`. This allows health resources to bleed through the UI, maintaining a sense of place.

---

## 3. Typography: Editorial Clarity
We use **Public Sans** for its institutional legibility and neutral warmth. The hierarchy is designed to feel like a high-end health journal.

- **Display & Headlines:** Use `display-lg` (3.5rem) and `headline-lg` (2rem) with tight letter-spacing (-0.02em). These should be used with generous top-padding to let the "authority" of the statement breathe.
- **Body Text:** `body-lg` (1rem) is our workhorse. Ensure a line-height of 1.6 to maintain WCAG accessibility and a relaxed reading pace.
- **Labels:** `label-md` (0.75rem) should be used in all-caps with +0.05em tracking for a "meta-data" editorial look, specifically in resource tags.

---

## 4. Elevation & Depth: Tonal Layering
We convey hierarchy through light and shadow, not lines.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The subtle shift from #ffffff to #f1f4f5 is enough to signal a clickable container to the modern user.
- **Ambient Shadows:** Where floating is required (e.g., Modals), use a "Health-Soft" shadow: `box-shadow: 0 10px 30px rgba(45, 51, 53, 0.06)`. The shadow color is derived from `on-surface` (#2d3335), ensuring it looks like natural ambient light.
- **The "Ghost Border":** If a border is required for accessibility (e.g., input focus), use the `outline-variant` (#adb3b5) at 20% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons: The Intentional Action
- **Primary:** Gradient fill (`primary` to `primary-container`), white text (`on-primary-fixed`), and `xl` (0.75rem) roundedness.
- **Secondary:** `surface-container-highest` background with `primary` text. No border.
- **Tertiary:** Pure text with `primary` color, using an underline only on hover to maintain a "clean" editorial look.

### Resource Cards
- **Structure:** No dividers. Use `title-md` for the resource name, followed by a `body-md` snippet. 
- **Separation:** Separation is achieved by an 8px vertical gap between the card's edge and its internal content, utilizing a `surface-container-lowest` background.
- **Corner Radius:** Use `lg` (0.5rem) for a professional yet approachable soft edge.

### Input Fields: Minimalist Professionalism
- **Background:** Use `surface-container-high` (#e5e9eb) with a `none` border.
- **Focus State:** Transition the background to `surface-container-lowest` and apply a 2px "Ghost Border" using `primary`. 
- **Validation:** Error states must use `error` (#a83836) for text and a subtle `error-container` (#fa746f) background tint at 10% opacity.

### Navigation: The Fluid Path
- **Desktop:** Use an asymmetrical layout. The logo is far left, with navigation items clustered toward the center-right, leaving "white space" as a functional design element.
- **Mobile:** A bottom "dock" using Glassmorphism (`surface` at 85% + blur) to keep vital health links within thumb-reach.

---

## 6. Do's and Don'ts

### Do
- **Do** use `surface-container-low` to group related resource cards.
- **Do** lean into asymmetry. For example, left-align headlines but right-align the "See all" action buttons to create a dynamic visual path.
- **Do** prioritize WCAG 2.1 AA contrast ratios. Our `primary` blue on `surface` backgrounds is specifically chosen for this.
- **Do** use the `full` (9999px) roundedness for "Status Chips" (e.g., "Available", "New") to distinguish them from square-ish buttons.

### Don't
- **Don't** use 1px solid black or grey dividers. Use vertical whitespace (32px, 48px, or 64px) to separate content sections.
- **Don't** use high-intensity shadows. If the shadow is "visible" before the content, it is too dark.
- **Don't** cram information. If a page feels full, add 24px of padding to the container. The "Sober" look requires the user's eye to rest.
- **Don't** use standard blue for links. Use the `primary` token (#0356d5) to ensure a signature, custom-branded feel.