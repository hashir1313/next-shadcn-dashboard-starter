# dropdown-menu

2026-07-04, transformation engine (legacy style `new-york`; stock wrapper). Radix
DropdownMenu → Base UI **Menu** (canonical menu mapping). Typecheck clean.

FIX 2026-07-04 (runtime issue found in dev): "Base UI: MenuGroupContext is
missing" — `DropdownMenuLabel` maps to `Menu.GroupLabel`, which THROWS outside a
`Menu.Group` (radix Label floated freely; the menus reference documents this and
the base registry wrapper is intentionally identical, expecting grouped usage).
Fixed at all six floating call sites by wrapping the label in
`<DropdownMenuGroup>`: `user-nav.tsx`, `app-sidebar.tsx`, `org-switcher.tsx`
(+Group import), `nav-user.tsx`, products/users `cell-action.tsx` (+Group
imports). Same latent constraint applies to the unused ContextMenuLabel/
MenubarLabel wrappers — future call sites must group them too.

## Changed

- `src/components/ui/dropdown-menu.tsx` — import → `@base-ui/react/menu`.
  - Content → Portal > Positioner (`isolate z-50 outline-none`, forwarded
    side/sideOffset/align/alignOffset, user's `sideOffset=4` default kept) > Popup.
    Vars: `--radix-dropdown-menu-content-available-height` → `--available-height`,
    transform-origin → `--transform-origin`; `data-[state=*]` → presence attrs.
  - `Label` → `GroupLabel`; `ItemIndicator` → `CheckboxItemIndicator` /
    `RadioItemIndicator`; `Sub` → `SubmenuRoot`; `SubTrigger` → `SubmenuTrigger`
    (`data-[state=open]:` → `data-popup-open:`).
  - SubContent now COMPOSES the public Content wrapper (registry shape:
    `align='start' alignOffset={-3} side='right' sideOffset={0}` + its shadow-lg
    class overrides).
  - Items: added `data-highlighted:*` variants alongside the existing `focus:*` —
    Base UI highlights items without moving DOM focus, so `focus:bg-accent` alone
    would never fire; the destructive-variant highlight styles got the same pair.
- Consumer fixes (7 files): `DropdownMenuTrigger asChild` → `render={…}` in
  `app-sidebar.tsx`, `user-nav.tsx`, `nav-projects.tsx`, `nav-user.tsx`,
  `org-switcher.tsx`, products/users `cell-action.tsx`. Also:
  `data-[state=open]:bg-sidebar-accent…` on trigger buttons → `data-popup-open:*`
  (3 files); `w-(--radix-dropdown-menu-trigger-width)` → `w-(--anchor-width)`
  (app-sidebar); `forceMount` dropped from user-nav's Content (Base UI keeps popups
  mounted through exit animations natively).

## Left alone

- `cell-action.tsx` `modal={false}` on the Root — Base UI Menu.Root supports
  `modal`; passes through unchanged.
- cmdk `CommandItem onSelect` usages — cmdk, not radix.

## Behavior changes

- **CheckboxItem/RadioItem no longer close the menu on click** (`closeOnClick`
  defaults false in Base UI; radix closed). No current call sites use those item
  types outside the unused theme selector patterns — flagged, not patched.
- Plain `Item` still closes on click (default true) — cell-action delete/edit
  actions behave as before.
- `loop` moved to Root `loopFocus` and now defaults TRUE (radix false): arrow-key
  navigation wraps around.

## Verify by hand

1. Header avatar menu: opens aligned right; profile/billing items navigate and
   close the menu; hover highlights items (the data-highlighted styling).
2. Sidebar footer user menu: matches trigger width, opens upward when space is
   tight, trigger shows the accent style while open.
3. Products/users table row ⋮ menu: edit navigates, delete opens the confirm
   modal; menu closes on item click.
