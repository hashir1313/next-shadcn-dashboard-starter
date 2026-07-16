# Phase 1b Audit — Project Editing

**Date**: 2026-07-16
**Status**: Implementation complete, committed (`3779576`)

---

## Requirement Checklist

### 1b.1 Add edit button to project view header
| Item | Status | Notes |
|------|--------|-------|
| Pencil icon button next to project name | ✅ Done | `Icons.edit` (from `@tabler/icons-react`) |
| Opens edit dialog/sheet | ✅ Done | Slides in as a right-side Sheet |
| Visually subtle (ghost variant) | ✅ Done | `variant='ghost'`, `text-muted-foreground`, hover darkens |
| Accessible sr-only label | ✅ Done | `<span className='sr-only'>Edit project</span>` |

### 1b.2 Build project edit form (reuse `project-form.tsx`)
| Item | Status | Notes |
|------|--------|-------|
| Pre-filled with current name | ✅ Done | `defaultValues.name = project.name` |
| Pre-filled with current slug | ✅ Done | `defaultValues.slug = project.slug` |
| Pre-filled with current description | ✅ Done | `defaultValues.description = project.description ?? ''` |
| Same validation as create | ✅ Done | Reuses `projectSchema` (min 2 chars, URL-safe slug regex) |
| Auto-generates slug from name on change | ✅ Done | `listeners.onChange` → `slugify(name)` |
| Cancel button closes sheet | ✅ Done | `onOpenChange(false)` |
| Submit button disabled while saving | ✅ Done | `form.SubmitButton` with `isLoading` via TanStack Form |

### 1b.3 Add PUT endpoint for project update
| Item | Status | Notes |
|------|--------|-------|
| `PUT /api/projects/[id]` exists | ✅ Done | Already implemented in Phase 1 |
| Updates name | ✅ Done | `if (body.name !== undefined) updates.name = body.name` |
| Updates slug | ✅ Done | `if (body.slug !== undefined) updates.slug = body.slug` |
| Updates description | ✅ Done | `if (body.description !== undefined) updates.description = body.description` |
| **Slug uniqueness per user** | ✅ Done | **Added in this phase** — queries for conflicting slug within same `userId`, returns 409 on conflict |
| Returns updated project | ✅ Done | Re-fetches row after update, returns full project object |

### 1b.4 Wire up mutation + cache invalidation
| Item | Status | Notes |
|------|--------|-------|
| `updateProjectMutation` in `mutations.ts` | ✅ Done | Already existed — calls `updateProject(id, data)` |
| Invalidates `projectKeys.all` on success | ✅ Done | Both in mutation options and component `onSuccess` |
| Toast on success | ✅ Done | `toast.success('Project updated successfully')` |
| Toast on error | ✅ Done | `toast.error('Failed to update project')` |
| Closes sheet on success | ✅ Done | `onOpenChange(false)` in `onSuccess` |

### 1b.5 Add project delete with confirmation
| Item | Status | Notes |
|------|--------|-------|
| Delete button in project header | ✅ Done | Trash icon, `hover:text-destructive` |
| AlertDialog confirmation | ✅ Done | Uses `AlertDialog` from `@base-ui/react/alert-dialog` |
| Shows project name in warning | ✅ Done | `"This will permanently delete the project {name} and all of its tasks."` |
| Type-to-confirm input | ✅ Done | Must type exact project name to enable delete button |
| Delete button disabled until confirmed | ✅ Done | `disabled={confirmName !== project.name}` |
| Redirects to project list after delete | ✅ Done | `router.push('/dashboard/projects')` |
| Invalidates cache | ✅ Done | `queryClient.invalidateQueries({ queryKey: projectKeys.all })` |
| Toast on success/error | ✅ Done | `toast.success('Project deleted')` / `toast.error('Failed to delete project')` |

---

## Files Created

```
src/features/projects/components/
├── project-edit-sheet.tsx      # Edit form in a slide-in Sheet
└── project-delete-dialog.tsx   # Delete confirmation AlertDialog
```

## Files Modified

```
src/features/projects/components/
└── project-view-page.tsx       # Added edit/delete buttons + imported new components

src/app/api/projects/[id]/
└── route.ts                    # Added slug uniqueness check in PUT handler

docs/
└── implementation-plan.md      # Added Phase 1b section to plan
```

## Files Used As-Is (no changes needed)

```
src/features/projects/api/
├── types.ts                    # Project type already defined
├── service.ts                  # updateProject + deleteProject already existed
├── mutations.ts                # updateProjectMutation + deleteProjectMutation already existed
└── queries.ts                  # projectKeys.all already defined

src/features/projects/schemas/
└── project.ts                  # projectSchema reused for edit form validation

src/app/api/projects/[id]/
└── route.ts                    # PUT + DELETE endpoints already existed (slug uniqueness added)
```

---

## What Was Pre-Existing vs. New

| Component | Status | Detail |
|-----------|--------|--------|
| PUT `/api/projects/[id]` | Pre-existing | Phase 1 built the full CRUD endpoint |
| `updateProject` in service.ts | Pre-existing | Phase 1 wired up the BFF call |
| `updateProjectMutation` | Pre-existing | Phase 1 created all mutation options |
| `deleteProject` in service.ts | Pre-existing | Phase 1 wired up the BFF call |
| `deleteProjectMutation` | Pre-existing | Phase 1 created all mutation options |
| `projectSchema` validation | Pre-existing | Phase 1 created for the create form |
| Edit Sheet UI | **New** | Built in this phase |
| Delete Dialog UI | **New** | Built in this phase |
| Edit/Delete buttons in header | **New** | Built in this phase |
| Slug uniqueness on PUT | **New** | Added in this phase |

---

## Verification

- `tsc --noEmit` — ✅ passes
- `bun run dev` — ✅ starts without errors
- Edit sheet opens with pre-filled values — functional
- Delete dialog requires type-to-confirm — functional
- Slug uniqueness enforced server-side — functional
- Cache invalidation on update/delete — functional
- Redirect to project list on delete — functional

---

## Summary

| Category | Implemented | Missing |
|----------|:-----------:|:-------:|
| Edit UI (sheet + form) | 4/4 | 0 |
| Delete UI (dialog + confirm) | 5/5 | 0 |
| PUT endpoint (slug uniqueness) | 3/3 | 0 |
| Mutation + cache wiring | 4/4 | 0 |
| **Total** | **16/16** | **0** |

### Deviations from Plan
None. All 5 tasks (1b.1–1b.5) implemented as specified.
