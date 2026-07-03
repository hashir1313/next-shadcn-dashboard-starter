# accordion

2026-07-04, transformation engine (legacy style `new-york`; stock wrapper). Content →
Panel with the base-registry animation placement. Typecheck clean.

## Changed

- `src/components/ui/accordion.tsx` — import → `@base-ui/react/accordion`; types →
  `.Props` forms. `Content` → `Panel`. Class rewrites:
  - Trigger: `[&[data-state=open]>svg]:rotate-180` → `[&[data-panel-open]>svg]:rotate-180`
    (trigger-specific attribute); added `aria-disabled:pointer-events-none
    aria-disabled:opacity-50` alongside the existing `disabled:*` (Base UI surfaces
    trigger disabled state via aria-disabled).
  - Panel: `data-[state=open/closed]:` → `data-open:`/`data-closed:` on the
    animate-accordion classes; the INNER div gains `h-(--accordion-panel-height)
    data-starting-style:h-0 data-ending-style:h-0` (base registry placement — the
    tw-animate keyframes only reference the radix height var, so the inner-div
    height transition is what actually animates).

Leftover scan clean.

## Left alone

- No `<Accordion>` call sites exist in app code — no consumer changes (and no
  `type="single" collapsible` props to convert).

## Behavior changes

- API for future call sites: `type="single"|"multiple"` is gone (`multiple` boolean;
  value/defaultValue are ALWAYS arrays); single mode is always collapsible.
- Keyboard: Base UI removed roving arrow-key focus between triggers (APG update).

## Verify by hand

1. No live usages; drop a 2-item accordion on a page: expand/collapse animates
   smoothly, chevron rotates, only inner div height animates (no content jump).
