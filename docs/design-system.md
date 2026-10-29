# Design system

Sanixor Rasoi's look is a bright, cut-away isometric kitchen: denim-blue cabinets, white tile, natural wood, and a terracotta "spice" accent for warmth. It pairs that with a serif display face, rounded shapes and gentle motion.

The hero artwork (`KitchenIllustration`) is an original drawing in that isometric style, inspired by the "blue kitchen" concept of Guillaume Kurkdjian's [Kitchen](https://dribbble.com/shots/7589778-Kitchen) shot. It is not a copy, and it uses Indian details: a gas stove with a pressure cooker and kadhai, a masala dabba, spice jars, a tulsi plant and a vegetable basket.

Everything lives in two places:

- **Tokens:** `src/app/globals.css`, in the Tailwind v4 `@theme` block.
- **Components:** `src/components/ui/`. Decorative SVGs are in `src/components/decor/`.

Components only use tokens through Tailwind utilities, such as `bg-canvas`, `text-ink`, `rounded-card` and `shadow-card`. Never put hex values in components.

## Colour

### Surfaces and brand

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F4F8FD` | Page background |
| `sky` | `#DDE9F7` | Section bands, preference panel, chips, info callouts, footer |
| `sky-deep` | `#B7CDEA` | Card art tint, chip-remove hover, text selection |
| `oak` | `#F3E4CF` | Warm accents: ingredient chips, time badges, swap callouts |
| `surface` | `#FFFFFF` | Card faces |
| `denim` | `#2F5D9B` | Primary button, selected pills, step numbers, brand mark, checkboxes |
| `denim-hover` | `#274F86` | Primary hover |
| `denim-edge` | `#1B3760` | Primary border, "pressed" shadow, selected-pill border |

### Text, accent and edges

| Token | Value | Use |
|---|---|---|
| `ink` | `#1E2B3A` | Headings and body text |
| `ink-muted` | `#4D5E72` | Secondary text and meta info |
| `accent-strong` | `#A8461E` (terracotta) | Eyebrows, links, focus ring, "today?" in the headline, chillies |
| `line` | `#DCE5F0` | Decorative dividers (not used to identify controls) |
| `line-strong` | `#6B819C` | Input, chip and stepper borders |
| `success`, `success-soft` | `#3D6B35`, `#E6F0D8` | Ingredient-usage icon |
| `warning`, `warning-soft` | `#7A4A08`, `#FFF0C7` | Allergen and safety callouts |
| `danger`, `danger-soft` | `#9B2C2C`, `#FFE4DE` | Validation and request errors |
| `veg`, `nonveg` | `#3F7D3A`, `#8A3A2B` | Diet marks |
| `wood*`, `steel*`, `wall-shade`, `turmeric`, `chilli`, `leaf`, `curry` | — | Illustration only; never used for text |

**Text on `denim` is always `surface` (white).** Text on every other surface is `ink`.

Green diet marks and terracotta chillies don't show up against `denim`. Inside a selected pill they sit on a small white backing, so they stay readable.

### Contrast (WCAG 2.x, computed)

Translucent surfaces were blended over their real background before measuring.

| Pair | Ratio | Needed |
|---|---|---|
| ink / canvas | 13.47 | 4.5 |
| ink / surface | 14.37 | 4.5 |
| ink / sky | 11.68 | 4.5 |
| ink / preferences panel (sky 60% on white) | 12.26 | 4.5 |
| ink / oak | 11.50 | 4.5 |
| ink / card art (sky-deep 60% on white) | 10.84 | 4.5 |
| ink / warning-soft | 12.68 | 4.5 |
| white / denim (primary, selected) | 6.65 | 4.5 |
| white / denim-hover | 8.24 | 4.5 |
| ink-muted / canvas | 6.23 | 4.5 |
| ink-muted / surface | 6.65 | 4.5 |
| ink-muted / sky | 5.40 | 4.5 |
| ink-muted / preferences panel | 5.67 | 4.5 |
| ink-muted / footer (sky 50% on canvas) | 5.83 | 4.5 |
| ink-muted / error state | 5.72 | 4.5 |
| ink-muted / oak | 5.32 | 4.5 |
| accent-strong / canvas | 5.53 | 4.5 |
| accent-strong / surface | 5.90 | 4.5 |
| accent-strong / sky | 4.80 | 4.5 |
| accent-strong / preferences panel | 5.04 | 4.5 |
| denim / canvas (icons, links) | 6.23 | 4.5 |
| danger / danger-soft | 6.24 | 4.5 |
| danger / surface | 7.53 | 4.5 |
| denim-edge border / canvas | 11.18 | 3 |
| line-strong border / surface | 4.00 | 3 |
| line-strong border / canvas | 3.75 | 3 |
| line-strong border / preferences panel | 3.42 | 3 |
| focus ring (accent-strong) / canvas | 5.53 | 3 |
| veg mark / surface | 4.99 | 3 |
| non-veg mark / surface | 7.72 | 3 |

**Avoid `accent-strong` directly on `denim`**, which is only 1.13:1. The focus ring is safe because it's drawn 2px outside the control, on the page background.

### Never colour alone

Colour is never the only signal. Each of these pairs it with a shape, an icon or text:

- **Diet** uses Indian food-label marks: a square with a circle for veg and a square with a triangle for non-veg. Vegan uses a leaf icon, eggetarian uses an egg icon, and every mark has a text label.
- **Spice** shows filled versus outlined chillies plus the words "Mild", "Medium" or "Hot".
- **Selected pills** switch from a white fill to dark denim with white semibold text. That's a large change in lightness, not just in hue.
- **Quick-add chips** switch from a + icon to a ✓ and set `aria-pressed`.
- **Warnings and errors** always have an icon and a title.

## Glassmorphism

Surfaces are frosted glass over four large, blurred colour blobs fixed behind the page (sky, curry, denim and oak, in `app/layout.tsx`). Three utilities in `globals.css`:

| Utility | Opacity | Use |
|---|---|---|
| `glass` | 62% white, blur 18px | Chrome without body text: kitchen frame, secrets dock, 3D pins, hint pill |
| `glass-strong` | 78% white, blur 22px | Anything with text: header, footer, cards, form panels, recipe sections, secret cards, dialogs' bars |
| `glass-ink` | 82% ink, blur 14px | Dark tooltips (white text) |

Rules:

- **Body text sits on `glass-strong`.** Even over the darkest blob (denim at 30%) the blended surface is near `#F6F8FC`, so `ink`, `ink-muted` and `accent-strong` keep their AA ratios. Don't put body text on plain `glass` over dark content.
- **Don't combine a glass utility with `bg-*` or `border-*` classes** on the same element; the glass utility sets both.
- **Only write `backdrop-filter`.** Tailwind's build adds the `-webkit-` prefix itself. Writing both by hand made the minifier keep only the prefixed one, which Chrome ignores.
- **Reduced transparency:** `prefers-reduced-transparency: reduce` turns all glass into solid surfaces.

## Typography

Fonts load through `next/font/google` in `src/app/layout.tsx`. Fonts are self-hosted at build time with `display: swap` and metric-matched fallbacks, so there is no layout shift.

| Role | Family | Token |
|---|---|---|
| Display: h1–h3, wordmark, step numbers | Fraunces | `font-display` |
| UI and body | DM Sans | `font-sans` (default) |
| Devanagari fallback | Noto Sans Devanagari | Second in both stacks |

| Level | Size |
|---|---|
| Display (h1) | 36px mobile, 48px tablet, 60px desktop |
| h2 | 28–32px |
| h3 | 20–24px |
| Body | 16–17px, line-height 1.6 |

**Hindi.** Put `lang="hi"` on any element holding generated Hindi text. Use `languageTag()` from `features/recipes/display.ts`, which returns `hi`, or `hi-Latn` for Hinglish. A small unlayered rule in `globals.css` then:

- raises the line-height to 1.8 (1.35 for headings) so matras don't clip;
- resets letter-spacing, because tracking breaks Devanagari conjuncts apart, as in uppercase eyebrows;
- leaves Hinglish (`hi-Latn`) alone.

## Shape, elevation, motion

| Token | Value | Use |
|---|---|---|
| `rounded-field` | 16px | Inputs, stat tiles |
| `rounded-card` | 24px | Cards |
| `rounded-panel` | 28px | Form panel, dialog, empty and error states |
| `rounded-full` | — | Pills, chips, buttons |
| `shadow-card` | `0 10px 30px -12px rgb(59 42 36 / .18)` | Resting cards |
| `shadow-card-hover` | — | Hovered cards and the dialog |
| `shadow-press` | 4px `denim-edge` drop | Primary button |
| `animate-fade-up` | 320ms | Results stagger (80ms per card), dialog open |
| `animate-shimmer` | — | Skeletons |
| `animate-float` | — | Hero steam, used with `motion-safe:` |

**Transitions** run for 150–250ms on `ease-soft`.

**Reduced motion.** `prefers-reduced-motion: reduce` collapses all animations and transitions to near zero, and smooth scrolling only applies under `no-preference`.

**Spacing** follows Tailwind's 4px scale:

- 16px side gutter on mobile;
- content capped at 1200px;
- sections separated by 48–64px.

## Components (`src/components/ui/`)

Components take typed props, set variants through props and contain no business logic.

| Component | Purpose and key props |
|---|---|
| `Button` / `buttonClasses()` | `variant`: `primary` (denim CTA), `secondary` (outlined) or `ghost` (link-like). `size`: `sm`, `md` or `lg`, all at least 44px tall. `fullWidth`. Use `buttonClasses()` to style a `Link`. |
| `Chip` | Static pill, `tone`: `oak`, `sky` or `surface`; `size`: `sm` or `md`. Passing `onRemove` and `removeLabel` adds a 44px × button. |
| `ChipToggle` | Suggestion pill with `aria-pressed`; shows + or ✓. |
| `SegmentedControl` | Native radio group styled as pills. Arrow keys work natively. Options can carry an `icon` and `lang`. |
| `Stepper` | −/+ number control with a labelled `role="group"` and a live `<output>`. `hideLabel` keeps the label for screen readers only. |
| `Card` / `cardClasses()` | White surface. `interactive` adds hover lift and a focus ring for cards with a stretched button. |
| `Badge` | Small status pill; `tone`: `neutral`, `accent`, `success`, `warning` or `danger`; optional `icon`. |
| `DietBadge`, `DietMark`, `dietLabels` | Diet shape mark with a label. |
| `SpiceMeter`, `ChilliRow` | Chilli indicator with text. `ChilliRow` is the icon-only version for controls that already have a label. |
| `Skeleton` | Shimmer block, `aria-hidden`. |
| `Callout` | `tone`: `info`, `tip`, `warning` or `danger`, with a default icon and optional `title`. |
| `EmptyState` | Illustration, title, description and action. |
| `ErrorState` | `role="alert"` block with title, description, Retry and an optional secondary action. |
| `SectionHeading` | Eyebrow, title and description. `as`: `h1`, `h2` or `h3`. `headingRef` makes the heading focusable, used to move focus to results. |

Shell and decor:

- **`SiteHeader`:** sticky; shows the language badge when given one.
- **`SiteFooter`:** tagline, AI disclaimer and ©.
- **`BrandMark`:** the pot-and-steam logo.
- **`KitchenIllustration`:** the hero image, an isometric kitchen drawn as inline SVG with `role="img"` and a description. It is generated by `scripts/generate-kitchen-illustration.py`; edit the script and regenerate rather than hand-editing coordinates. It sits beside the form on desktop and below it on smaller screens.
- **`LeafDoodle`, `ChilliDoodle`, `SteamDoodle`:** `aria-hidden`, low opacity.

### Feature components

| Component | Where | Purpose |
|---|---|---|
| `KitchenHero` / `Kitchen3D` | `components/kitchen3d/` | three.js kitchen that **assembles itself on load** (the floor spreads, walls rise, then cabinets, appliances and props drop in while the camera swings round) and **leans toward the cursor** anywhere on the page; drag to orbit. Pins for stove → form, cookbooks → `/book`, fridge → `/book/new`. Falls back to the SVG for no-WebGL and reduced motion. |
| Kitchen secrets | `kitchen3d/kitchen-secrets.ts` | Clicking an object (or its button in the glass dock) opens a glass card. Basket adds potato, onion and tomato to the ingredients; masala dabba and spice jars show a spice of the day; the cooker whistles with a steam burst and a whistle-count guide; the clock suggests a meal for the time of day and sets the time filter; the window switches day and night lighting (moon included); tulsi shows a fact. The card overlays the kitchen from `sm` up and sits below it on phones. |
| `RecipeView` | `features/recipes/components/` | The full recipe layout used by the AI dialog and book pages: stats, checklist, equipment, nutrition, steps, video, tips, swaps, allergens. |
| `CookMode` | `features/recipes/components/` | Full-screen native `<dialog>`; one step at a time, per-step timer with an announced "timer done", ←/→ keys, Wake Lock. |
| `RecipeVideo` | `features/recipes/components/` | YouTube embed (`youtube-nocookie`), native `<video>` for uploads, and a YouTube search link for every dish. |
| `HeaderNav` | `components/` | Desktop links, account status, language badge; a disclosure menu below `lg`. |
| `RecipeForm`, `FileUploadField`, `AuthForm` | `features/recipe-book/components/` | Add/edit recipes with row editors, upload progress, inline errors and a focusable error summary. |

### Patterns

- **Whole-card click target.** The card's title is a real `<button>` inside the `h3`. Its `after:absolute after:inset-0` pseudo-element stretches over the card, and the card shows the focus ring through `has-[:focus-visible]`. This keeps the heading semantics valid.
- **Recipe detail.** A native `<dialog>`: full screen below `md`, a 1080px panel above. Page scroll is locked with `html:has(dialog[open])`. Escape and "Back to results" both close it, and the browser returns focus to the card.
- **Focus after generating.** Focus moves to the results heading, so keyboard and screen-reader users land on the results.
- **Errors.** API error codes map to friendly copy in `features/recipes/error-copy.ts`. Raw codes and server messages are never shown.

## Adding a dark theme later

Every colour is a CSS variable emitted by `@theme`. A dark theme only needs a `:root[data-theme="dark"]` block, plus a `prefers-color-scheme` block, that redefines the same `--color-*` names. Components don't need to change. Re-run the contrast checks for the new values.
