# Traqqy — Architecture

## 1. System Architecture Overview

Traqqy is built on the existing **next-shadcn-dashboard-starter** foundation. The architecture follows Next.js 16 App Router conventions with a feature-based module structure, server-side prefetching via TanStack Query, and client-side interactivity where needed.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Public   │  │ Freelancer   │  │ Admin                    │   │
│  │ Page     │  │ Dashboard    │  │ Panel                    │   │
│  │ (No Auth)│  │ (Auth'd)     │  │ (Admin Role)             │   │
│  └────┬─────┘  └──────┬───────┘  └───────────┬──────────────┘   │
│       │               │                      │                   │
└───────┼───────────────┼──────────────────────┼───────────────────┘
        │               │                      │
        ▼               ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 (App Router)                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ RSC (Server) │  │ Client       │  │ API Routes         │    │
│  │ - Public pg  │  │ Components   │  │ /api/*             │    │
│  │ - Prefetch   │  │ - Forms      │  │ (BFF or Direct)    │    │
│  │ - Metadata   │  │ - Tables     │  │                    │    │
│  │ - Auth gates │  │ - Kanban     │  │                    │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
│         │                 │                    │                 │
└─────────┼─────────────────┼────────────────────┼─────────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  features/<name>/api/                                    │    │
│  │    types.ts    →  service.ts    →  queries.ts            │    │
│  │    ┌──────────┐   ┌──────────┐   ┌──────────┐           │    │
│  │    │ Type     │   │ Data     │   │ React    │           │    │
│  │    │ Contract │──▶│ Access   │──▶│ Query    │           │    │
│  │    │          │   │ Layer    │   │ Options  │           │    │
│  │    └──────────┘   └──────────┘   └──────────┘           │    │
│  └──────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Backend Options (swap via service.ts)                     │    │
│  │                                                           │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐   │    │
│  │  │ Mock    │  │ Server   │  │ Route  │  │ External │   │    │
│  │  │ (InMem) │  │ Actions  │  │ Handl. │  │ API      │   │    │
│  │  └─────────┘  └──────────┘  └────────┘  └──────────┘   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### How the architecture flows — explained

The diagram reads **top to bottom**:

**Layer 1 — Browser**: Three entry points. The **Public Page** requires no authentication (freelancer shares the URL with a client). The **Freelancer Dashboard** requires a signed-in user. The **Admin Panel** requires a user with an admin role. All three hit the same Next.js server.

**Layer 2 — Next.js 16 (App Router)**: The server handles all three entry points but uses different rendering strategies:
- **RSC (Server Components)**: Public pages are fully server-rendered — no JavaScript needed to view. Freelancer pages use server components to prefetch data and gate access (auth checks, plan checks). Metadata and SEO tags are set here.
- **Client Components**: Interactive UI like forms, data tables, and the Kanban board. These use TanStack Query (`useSuspenseQuery`) to read data that was prefetched by the server component above.
- **API Routes** (`/api/*`): Optional BFF (Backend For Frontend) layer. In the default mock setup, route handlers call the same service functions as the client. In production, they can proxy to an external backend or call an ORM directly.

**Layer 3 — Service Layer**: The heart of the data architecture. Each feature follows a strict three-file pattern:
- `types.ts` — defines the contract (response shapes, filter types, mutation payloads)
- `service.ts` — data access logic. **This is the only file you swap** when connecting a real database
- `queries.ts` — TanStack Query key factories and `queryOptions` for cache management

**Layer 4 — Backend Options**: The service layer can talk to any backend without changing the rest of the app. During development it uses in-memory mock data. For production, `service.ts` will use **Drizzle ORM** against a **Neon PostgreSQL** database via Server Actions (add `'use server'` to service.ts and call Drizzle queries directly). Route Handlers at `/api/*` are available for BFF patterns if needed.

### Rendering flow example (Freelancer Dashboard)

```
1. User visits /dashboard/projects
2. Server Component reads auth → gets userId
3. Server Component calls queryClient.prefetchQuery(projectsQueryOptions)
   (void — fire and forget, doesn't block render)
4. Server Component renders <HydrationBoundary> with dehydrated cache
5. Client Component mounts with useSuspenseQuery()
   → Data is already in cache from step 3 → instant render
   → On subsequent navigations, Suspense fallback shows until cached
6. User creates a project via form → useMutation calls service.ts
   → On success: queryClient.invalidateQueries(projectKeys.all)
   → Table re-renders with new data (no page reload)
```

## 2. Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── auth/                      # Auth pages (sign-in, sign-up)
│   ├── dashboard/                 # Freelancer dashboard
│   │   ├── layout.tsx             # Sidebar + Header + KBar
│   │   ├── overview/              # Dashboard home
│   │   ├── projects/              # Project CRUD pages
│   │   │   ├── page.tsx           # Project listing
│   │   │   ├── new/page.tsx       # Create project
│   │   │   └── [projectId]/       # Single project view
│   │   │       └── page.tsx       # List + Kanban + public URL
│   │   ├── settings/              # Settings pages
│   │   │   ├── page.tsx           # Settings overview/tabs
│   │   │   ├── account/           # Account management
│   │   │   └── branding/          # Branding (Pro only)
│   │   ├── billing/               # Billing & plans
│   │   ├── profile/               # User profile page
│   │   └── notifications/         # Notification center
│   │
│   ├── [username]/               # Public routes
│   │   └── [projectSlug]/
│   │       └── page.tsx           # Public client page (SSR)
│   │
│   ├── admin/                     # Admin panel
│   │   ├── layout.tsx             # Admin layout (admin role gate)
│   │   ├── page.tsx               # Admin overview / stats
│   │   ├── users/                 # User management
│   │   ├── announcements/         # Announcements CRUD
│   │   ├── feedback/              # Feedback viewer
│   │   ├── features/              # Feature & beta flags
│   │   └── analytics/             # PostHog dashboard
│   │
│   ├── api/                       # API route handlers (BFF)
│   │   ├── users/                 # User CRUD for admin
│   │   ├── projects/              # Project CRUD
│   │   ├── tasks/                 # Task CRUD
│   │   ├── feedback/              # Feedback submission
│   │   ├── branding/              # Branding config CRUD
│   │   └── announcements/         # Announcements CRUD
│   │
│   ├── layout.tsx                 # Root layout (Theme, Query)
│   └── page.tsx                   # Landing / redirect
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/                    # AppSidebar, Header, PageContainer
│   ├── themes/                    # Theme system
│   ├── kbar/                      # Command+K search
│   └── icons.tsx                  # Centralized icon registry
│
├── features/                      # Feature-based modules
│   ├── projects/                  # Projects feature
│   │   ├── api/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   └── queries.ts
│   │   ├── components/
│   │   │   ├── project-list.tsx
│   │   │   ├── project-form.tsx
│   │   │   ├── project-card.tsx
│   │   │   ├── task-list-view.tsx
│   │   │   ├── task-kanban-view.tsx
│   │   │   ├── view-switcher.tsx
│   │   │   └── progress-bar.tsx
│   │   └── schemas/
│   │       └── project.ts
│   │
│   ├── public-page/               # Public client page
│   │   ├── components/
│   │   │   ├── public-project-view.tsx
│   │   │   ├── public-task-list.tsx
│   │   │   └── public-progress-bar.tsx
│   │   └── api/                   # Server-side fetch
│   │       └── service.ts
│   │
│   ├── admin/                     # Admin panel feature
│   │   ├── api/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   └── queries.ts
│   │   ├── components/
│   │   │   ├── user-table.tsx
│   │   │   ├── user-detail-sheet.tsx
│   │   │   ├── feature-flags.tsx
│   │   │   ├── announcement-form.tsx
│   │   │   └── feedback-viewer.tsx
│   │   └── constants/
│   │       └── admin-nav.ts
│   │
│   ├── branding/                  # Branding feature (Pro)
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── branding-form.tsx
│   │   │   ├── logo-upload.tsx
│   │   │   └── public-theme-preview.tsx
│   │   └── schemas/
│   │       └── branding.ts
│   │
│   ├── billing/                   # Billing feature
│   │   └── components/
│   │       └── plans-list.tsx
│   │
│   ├── feedback/                  # Feedback system
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── feedback-button.tsx
│   │   │   ├── milestone-prompt.tsx
│   │   │   └── feedback-modal.tsx
│   │   └── store/
│   │       └── feedback-store.ts  # Zustand for milestone state
│   │
│   └── announcements/            # Announcements
│       ├── api/
│       └── components/
│           └── announcement-banner.tsx
│
├── config/
│   ├── nav-config.ts             # Freelancer navigation
│   ├── admin-nav-config.ts       # Admin navigation
│   └── feature-flags.ts          # Default feature flag config
│
├── constants/
│   ├── mock-api-projects.ts      # Mock project data
│   ├── mock-api-tasks.ts         # Mock task data
│   └── mock-api-users.ts         # Existing user mock data
│
├── hooks/
│   ├── use-branding.ts           # Branding state hook
│   ├── use-feature-flags.ts      # Feature flag checks
│   └── ... (existing hooks)
│
├── lib/
│   ├── utils.ts                  # cn(), formatters
│   ├── api-client.ts             # Typed fetch wrapper
│   ├── query-client.ts           # Query client singleton
│   └── searchparams.ts           # URL param utilities
│
├── types/
│   └── index.ts                  # Core types (NavItem, etc.)
│
├── styles/
│   ├── globals.css
│   ├── theme.css                 # Imports all theme CSS
│   └── themes/                   # 10 theme CSS files
│
└── middleware.ts                 # Better Auth session cookie check
```

## 3. Component Architecture

### Page Rendering Strategy

```
Public Page:       Server Component (RSC) → fetches data → renders HTML
                   No JavaScript required for viewing

Freelancer Page:   Server Component → prefetches → HydrationBoundary
                                           ↓
                                    Client Component (useSuspenseQuery)
                                           ↓
                                    Interactive UI (forms, kanban, etc.)

Admin Page:        Server Component → admin role check → prefetch → render
```

### Data Flow Pattern

```
Page (Server)                  Component (Client)
─────────────                  ─────────────────
searchParamsCache.parse()      useSuspenseQuery(options)
       │                              ▲
       ▼                              │
queryClient.prefetchQuery()           │
  (void, fire-and-forget)             │
       │                              │
       ▼                              │
HydrationBoundary ────────────────────┘
  (dehydrate(queryClient))       useMutation()
                                       │
                                       ▼
                                 service.ts function
                                       │
                                       ▼
                               queryClient.invalidateQueries()
```

## 4. Theme System Architecture

### Dashboard Themes (Freelancer's UI)
- 10 pre-built CSS themes in `src/styles/themes/`
- Selected via header dropdown → stored in cookie (`active_theme`)
- Applied via `data-theme` attribute on `<html>`
- Dark/light mode via `next-themes` (class-based)
- No database needed — purely client-side preference

### Public Page Themes (Client-Facing Branding)
- Stored in database per freelancer
- Includes: primary color, background color, font family, border radius, logo URL
- Only configurable on Pro plan
- Applied server-side during public page SSR
- Fetch branding config by userId, embed as inline styles / CSS variables in the rendered HTML

**Font handling**:
- A fixed set of Google Fonts (e.g., Inter, DM Sans, Geist) are pre-loaded on the public page layout via `next/font/google`, each with a CSS variable (`--font-inter`, `--font-dm-sans`, etc.)
- The DB stores only a font **key** (e.g., `"inter"`) — not a raw CSS value
- The public page applies `fontFamily: \`var(--font-${key})\`` on the body

**Border radius**:
- The DB stores a number in pixels (e.g., `8`)
- Applied as `style={{ borderRadius: \`${value}px\` }}` on card/container elements

## 5. Security & Access Control

| Concern | Approach |
|---|---|
| Route protection | Better Auth cookie-based session check in `middleware.ts` |
| Data isolation | All queries filtered by `userId` from session |
| Public page | No auth — fetches by userId + slug publicly |
| Feature gates | `user.plan` from database (synced via Paddle webhooks) for Pro features |
| API protection | Session check via `getSession()` / `getUserId()` from `auth-utils.ts` |

## 6. Key Integration Points

| Service | Integration |
|---|---|
| Better Auth | `better-auth` — self-hosted auth with Drizzle adapter, email/password + Google OAuth |
| Paddle | Paddle.js for checkout, webhooks for plan sync, plan-based gating via DB |
| PostHog | `posthog-js` for product analytics |
| Sentry | Already integrated — error tracking for both client/server |
| Logo Upload | Vercel Blob — integrates natively with Next.js, no extra SDK needed |

## 7. State Management

| State Type | Tool |
|---|---|
| Server state (data) | TanStack React Query |
| URL state (filters, pagination) | nuqs |
| UI state (theme, sidebar) | Cookies + React context |
| Local UI state (kanban, notifications) | Zustand |
| Form state | TanStack Form |

## 8. Public Page Performance

```
Client Request → Edge/CDN
                     ↓
            Next.js Server (SSR)
                     ↓
        Fetch freelancer + project data
                     ↓
        Apply public theme (DB) as CSS vars
                     ↓
        Render HTML (no JS bundle for viewing)
                     ↓
        Serve → < 2s TTFB target
```

The public page should be fully functional without JavaScript. Task list, progress bar, and branding are all rendered server-side. The only JS included is for the "Copy link" button (if needed) and analytics.
