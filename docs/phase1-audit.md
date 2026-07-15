# Phase 1 Audit — Projects & Tasks

**Date**: 2026-07-15
**Status**: Implementation complete, committed (`c36fe28`)

---

## Architecture

- **BFF pattern**: Client components → `service.ts` (fetch via `apiClient`) → API route handlers → Drizzle ORM → Neon Postgres
- **Real DB connected**: Schema pushed via `bun run db:push`; mock stores removed (only type re-exports remain)
- **`apiClient`**: Uses absolute URLs (`http://localhost:3000`) on server for SSR prefetch, relative URLs on client
- **`ensureUser()`**: Auto-creates DB user row on first project creation (Clerk FK constraint)
- **Cache invalidation**: Component `onSuccess`/`onError`/`onSettled` handlers call `invalidateQueries` (overrides `mutationOptions.onSuccess`)

---

## Requirement Checklist

### 1.1 Create `features/projects/` module
| Item | Status | Notes |
|------|--------|-------|
| `api/types.ts` | ✅ Done | Project, Task, TaskStatus, response types, `ProjectCreatePayload` |
| `api/service.ts` | ✅ Done | BFF pattern — calls `/api/*` via `apiClient` |
| `api/queries.ts` | ✅ Done | React Query key factories + queryOptions |
| `api/mutations.ts` | ✅ Done | All CRUD mutations for projects and tasks |
| `schemas/project.ts` | ✅ Done | Zod schemas for project and task forms |
| `components/` | ✅ Done | 8 components created |

### 1.2 Create project types, service, queries
| Item | Status | Notes |
|------|--------|-------|
| `Project` type matches DB schema | ✅ Done | id, userId, name, slug, description, totalTasks, completedTasks, progress |
| `Task` type matches DB schema | ✅ Done | id, projectId, title, description, status, position |
| `TaskStatus` enum | ✅ Done | `'pending' | 'in_progress' | 'completed'` |
| Service layer pattern | ✅ Done | BFF — service.ts calls API routes, route handlers call Drizzle |
| Query key factory | ✅ Done | `projectKeys.all`, `.list()`, `.detail()`, `.tasks()`, `.slug()`, `.public()` |
| Mutation options | ✅ Done | Create/update/delete for both projects and tasks |

### 1.3 Build project creation page (`/dashboard/projects/new`)
| Item | Status | Notes |
|------|--------|-------|
| Route exists | ✅ Done | `/dashboard/projects/new` |
| Form: name (required) | ✅ Done | Min 2 chars |
| Form: slug (auto-gen, editable) | ✅ Done | Auto-generated from name, regex-validated |
| Form: description (optional) | ✅ Done | Textarea, max 500 chars |
| Form: initial tasks | ✅ Done | Dynamic task list with add/remove at creation |
| Redirect after create | ✅ Done | Redirects to `/dashboard/projects/[id]` |
| Validation | ✅ Done | Zod schema, onBlur validators |
| Cancel/back button | ✅ Done | Returns to previous page |

### 1.4 Build project list page (`/dashboard/projects`)
| Item | Status | Notes |
|------|--------|-------|
| Route exists | ✅ Done | `/dashboard/projects` |
| Shows all user projects | ✅ Done | Filtered by userId |
| Cards or table | ✅ Done | Card grid (responsive: 1/2/3 columns) |
| Progress visible on each | ✅ Done | Progress bar + percentage |
| Status badge | ✅ Done | Not Started / In Progress / Done |
| Empty state | ✅ Done | "No projects yet" with create button |
| Server-side prefetch | ✅ Done | Uses `HydrationBoundary` + `dehydrate` |

### 1.5 Build single project view (`/dashboard/projects/[projectId]`)
| Item | Status | Notes |
|------|--------|-------|
| Route exists | ✅ Done | `/dashboard/projects/[projectId]` |
| Project header | ✅ Done | Name + description |
| Progress bar | ✅ Done | Derived from tasks query (single source of truth) |
| Public URL displayed | ✅ Done | Shows full URL |
| Copy button | ✅ Done | Copies to clipboard with tick icon feedback |
| "Open public page" link | ✅ Done | Preview button opens in new tab |
| Server-side prefetch | ✅ Done | Prefetches project + tasks |

### 1.6 Build List view for tasks
| Item | Status | Notes |
|------|--------|-------|
| Add task inline | ✅ Done | Input + Enter key or button |
| Edit task inline | ✅ Done | Click edit icon, type, Enter to save |
| Delete task | ✅ Done | AlertDialog confirmation with task title |
| Status dropdown | ✅ Done | DropdownMenu on status badge with all 3 options |
| Optimistic updates | ✅ Done | Instant UI, 300ms debounced server mutation |
| Empty state | ✅ Done | "No tasks yet" message |

### 1.7 Build Kanban view for tasks
| Item | Status | Notes |
|------|--------|-------|
| Three columns | ✅ Done | Pending / In Progress / Completed |
| Column headers | ✅ Done | Icon + title + count badge |
| Task cards in columns | ✅ Done | Title + description preview |
| Drag-and-drop between columns | ✅ Done | Uses starter's `Kanban`/`KanbanBoard`/`KanbanColumn`/`KanbanItem` |
| Empty column state | ✅ Done | "Drop tasks here" placeholder |
| Status updates on drop | ✅ Done | Before/after snapshot diffing fires `updateTaskStatus` mutation |
| Progress updates on drop | ✅ Done | Derived from tasks query, updates automatically |
| Drag overlay | ✅ Done | `KanbanOverlay` shows card preview while dragging |

### 1.8 Build View switcher (List ↔ Kanban)
| Item | Status | Notes |
|------|--------|-------|
| Toggle button pair | ✅ Done | List + Kanban buttons |
| Visual active state | ✅ Done | Default variant for active, ghost for inactive |
| State management | ✅ Done | Local state via useState |

### 1.9 Implement progress calculation and display
| Item | Status | Notes |
|------|--------|-------|
| Formula: (completed / total) × 100 | ✅ Done | Computed client-side from tasks query |
| Progress bar component | ✅ Done | `Progress` from shadcn/ui |
| "X/Y tasks completed" text | ✅ Done | |
| Auto-recalculates on task change | ✅ Done | Derived from tasks query — no optimistic writes, no desync |
| 0 tasks = 0% | ✅ Done | |
| Single source of truth | ✅ Done | Progress computed from `tasks.filter(t => t.status === 'completed').length / tasks.length` |

### 1.10 Add navigation items for projects
| Item | Status | Notes |
|------|--------|-------|
| Projects in nav config | ✅ Done | "Projects" with `post` icon |
| Shortcut key | ✅ Done | `['p', 'p']` |
| URL correct | ✅ Done | `/dashboard/projects` |
| Demo items labeled | ✅ Done | "(Demo)" suffix added to Product, Users, Kanban, Chat |

### 1.11 Wire up public URL slug + copy button
| Item | Status | Notes |
|------|--------|-------|
| Slug display | ✅ Done | Full URL shown in header |
| Copy to clipboard | ✅ Done | Button copies origin + publicUrl |
| Toast feedback | ✅ Done | "Public URL copied to clipboard" |
| "Open public page" link | ✅ Done | Preview button, opens in new tab |
| URL format `/{username}/{slug}` | ✅ Done | Uses Clerk userId as username |

---

## Summary

| Category | Implemented | Missing |
|----------|:-----------:|:-------:|
| Feature API layer | 6/6 | 0 |
| Project CRUD pages | 3/3 | 0 |
| Task views | 2/2 | 0 |
| View switcher | 1/1 | 0 |
| Progress | 1/1 | 0 |
| Navigation | 1/1 | 0 |
| Public URL | 1/1 | 0 |
| **Total** | **15/15** | **0** |

### Nice-to-haves
| Item | Status | Notes |
|------|--------|-------|
| Initial tasks at project creation | ✅ Done | Dynamic task list with add/remove |
| Task delete confirmation | ✅ Done | AlertDialog with task title |
| View persistence in URL | Not done | Using local state, could use `nuqs` for URL persistence |
| Task reordering in list view | Not done | PRD lists this as P2, not required for MVP |

### API Routes (BFF pattern)
```
src/app/api/
├── projects/
│   ├── route.ts              # GET (list) + POST (create)
│   └── [id]/
│       ├── route.ts          # GET (detail) + PUT (update) + DELETE
│       └── tasks/
│           ├── route.ts      # GET (list) + POST (create)
│           └── reorder/
│               └── route.ts  # POST (reorder)
├── tasks/
│   └── [id]/
│       ├── route.ts          # PUT (update) + DELETE
│       └── status/
│           └── route.ts      # PATCH (status update + progress recalc)
└── public/
    └── [username]/
        └── [slug]/
            └── route.ts      # GET (public project + tasks)
```

### Files Created (27 total)
```
src/features/projects/
├── api/
│   ├── types.ts
│   ├── service.ts
│   ├── queries.ts
│   └── mutations.ts
├── schemas/
│   └── project.ts
└── components/
    ├── project-form.tsx
    ├── project-card.tsx
    ├── project-listing.tsx
    ├── project-view-page.tsx
    ├── task-list-view.tsx
    ├── task-kanban-view.tsx
    ├── view-switcher.tsx
    └── progress-bar.tsx

src/app/dashboard/projects/
├── page.tsx
├── new/
│   └── page.tsx
└── [projectId]/
    └── page.tsx

src/app/api/projects/
├── route.ts
└── [id]/
    ├── route.ts
    └── tasks/
        ├── route.ts
        └── reorder/
            └── route.ts

src/app/api/tasks/
└── [id]/
    ├── route.ts
    └── status/
        └── route.ts

src/app/api/public/
└── [username]/
    └── [slug]/
        └── route.ts

src/lib/
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── users.ts
└── api-client.ts
```

### Verification
- `tsc --noEmit` — ✅ passes
- `bun run dev` — ✅ starts without errors
- Real DB — ✅ Neon Postgres via Drizzle ORM
- API routes — ✅ 6 route handlers (projects, tasks, status, reorder, public)
- Optimistic updates — ✅ Instant UI for status changes (list + kanban)
- Progress sync — ✅ Derived from tasks query, no desync possible
