# popover

2026-07-04, transformation engine (legacy style `new-york`; stock wrapper). Content →
Portal > Positioner > Popup; Anchor became an inert passthrough (FLAGGED). Typecheck
clean.

## Changed

- `src/components/ui/popover.tsx` — import → `@base-ui/react/popover`. Content:
  `align`(center)/`alignOffset`(0)/`side`(bottom)/`sideOffset`(4) declared →
  destructured → forwarded to `<Positioner className='isolate z-50'>`; Popup keeps
  the user's classes with `data-[state=*]` → `data-open`/`data-closed` and origin
  var → `--transform-origin`.
- Consumer fixes (`PopoverTrigger asChild` → `render={<Button …/>}`):
  `src/components/forms/demo-form.tsx` (combobox + two date pickers; also
  `w-[--radix-popover-trigger-width]` → `w-(--anchor-width)`),
  `src/features/notifications/components/notification-center.tsx`,
  `src/components/ui/table/data-table-date-filter.tsx`,
  `data-table-faceted-filter.tsx`, `data-table-slider-filter.tsx`,
  `data-table-view-options.tsx`.

## Left alone

- Call-site `align='start'/'end'` and `sideOffset` props — still supported via the
  hoisted Positioner props.

## Behavior changes

- **PopoverAnchor is now an inert `<div>` passthrough** — Base UI has no Anchor
  part (anchoring is the Positioner's `anchor` prop). No call sites exist; flagged
  so future usage isn't silently broken.
- Dismiss callbacks (`onInteractOutside` etc.) no longer exist as Content props;
  use `onOpenChange`'s eventDetails. No call sites used them.

## Verify by hand

1. Products table: open the column-options popover (⚙) and each filter popover —
   position under the trigger, align respected, outside click dismisses, Escape
   closes and returns focus.
2. Demo form combobox: popover matches trigger width (anchor-width var), cmdk list
   filters and selects.
3. Notification bell: panel opens aligned right with 8px offset.
