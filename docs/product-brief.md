# Traqqy — Product Brief

## Overview

**Traqqy** is a project management tool for freelancers with a public client-facing progress page. Freelancers manage projects and tasks privately (list + kanban views), and share a public URL (`username/project-slug`) with clients to show progress without requiring client accounts.

**Deployment:** Vercel (Next.js 16 App Router, standalone output)

---

## Core Features

### 1. Projects & Tasks (Freelancer Private View)

**Project**
- Name (required)
- Slug (auto-generated from name, customizable, unique per freelancer)
- Description (optional)
- Freelancer owner (Clerk user)

**Task**
- Title
- Description (optional)
- Status: `pending` | `in_progress` | `completed`
- Project association
- Order/position (for kanban columns)

**Progress Calculation**
- Only `completed` tasks count toward progress %
- Formula: `completed_tasks / total_tasks * 100`

**Views**
- **List View** — Table with filters, pagination, sorting (TanStack Table + TanStack Query)
- **Kanban View** — Three columns: Pending, In Progress, Completed (dnd-kit)

### 2. Public Client Page (`/[username]/[project-slug]`)

**No authentication required** — fully public.

**Content:**
- Project name & description
- Freelancer info: logo, name, email
- Progress bar + percentage
- All tasks grouped by status (Pending, In Progress, Completed)

**Theming (Pro only):**
- One theme per freelancer (applies to all their projects)
- Customizable:
  - Logo upload
  - Primary color (OKLCH/hex)
  - Border radius (0–1, maps to CSS `--radius`)
  - Sans-serif font (Google Fonts)
  - Monospace font (Google Fonts)
  - Light/Dark mode
- Stored in Clerk `publicMetadata.branding` + synced to DB
- Applied via inline CSS variables on public page wrapper

### 3. Freelancer Settings (`/dashboard/settings`)

| Tab | Features | Plan Gate |
|-----|----------|-----------|
| **Public Page** | Logo, name, Email, colors, radius, fonts, mode | Pro only |
| **Customization** | Dashboard theme picker (10 presets), dark/light mode | Free |
| **Account** | Name, Username, email, plan info, delete account | Free |

**Dashboard Themes** (separate from public themes):
- 10 presets (Vercel, Claude, Supabase, etc.)
- Stored in `localStorage`
- Applied via `data-theme` on `<html>`
- Free for all users

### 4. Admin Panel (`/admin`)

**Access:** Role-based (`role: 'admin'` in Clerk)

**Features:**
- **User Management** — View profile (avatar, name, email, logo), change plan, suspend, delete, impersonate
- **Announcements** — Create/edit/dismiss global announcements
- **Feedback** — View feedback submitted via in-app widget
- **Feature Flags** — Toggle: file uploads, signups, feedback widget
- **Analytics** — PostHog dashboard embed

### 5. Billing & Subscriptions (Paddle)

**Why Paddle:** Merchant of Record, supports Pakistan payouts to local bank accounts.

**Plans:**
- **Free** — Core features (projects, tasks, kanban, list view, public page with default theme)
- **Pro** — Custom branding on public page, custom themes, logo, fonts, colors, radius

**Integration:**
- Plans/prices managed in **Paddle Dashboard**
- Price IDs stored in `src/config/plans.ts`
- Checkout via Paddle.js overlay
- Webhook: `src/app/api/paddle/webhook/route.ts` → updates Clerk `publicMetadata`
- Customer portal for subscription management
- Feature gating via Clerk `has({ feature: 'branding' })`

---

## Technical Architecture

### Stack
- **Framework:** Next.js 16 (App Router)
- **Auth:** Clerk (Organizations for workspaces, Users for freelancers)
- **Database:** PostgreSQL (Prisma ORM) — *confirmed*
- **Payments:** Paddle
- **Analytics:** PostHog
- **Error Tracking:** Sentry
- **UI:** shadcn/ui (New York), Tailwind CSS v4
- **State:** TanStack Query, Zustand, nuqs
- **Forms:** TanStack Form + Zod

### Feature Structure (New)

```
src/
├── features/
│   ├── projects/                    # NEW: Projects + Tasks
│   │   ├── api/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   └── queries.ts
│   │   ├── components/
│   │   │   ├── project-listing.tsx
│   │   │   ├── project-kanban.tsx
│   │   │   ├── project-form.tsx
│   │   │   ├── task-form.tsx
│   │   │   └── columns.tsx
│   │   ├── schemas/
│   │   └── constants/
│   ├── users/                       # EXTEND: Add branding, settings
│   ├── billing/                     # NEW: Paddle integration
│   │   ├── api/
│   │   ├── components/
│   │   └── hooks/
│   └── admin/                       # NEW: Admin panel
│       ├── api/
│       ├── components/
│       └── app/
├── app/
│   ├── dashboard/
│   │   ├── projects/                # NEW: Project list + create
│   │   │   ├── page.tsx
│   │   │   ├── [projectId]/
│   │   │   │   ├── page.tsx         # List view
│   │   │   │   └── kanban/page.tsx  # Kanban view
│   │   └── settings/
│   │       ├── branding/page.tsx    # NEW: Branding editor (pro)
│   │       ├── customization/page.tsx
│   │       └── account/page.tsx
│   ├── [username]/
│   │   └── [slug]/
│   │       └── page.tsx             # NEW: Public project page
│   ├── admin/                       # NEW: Admin panel
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── announcements/page.tsx
│   │   ├── feedback/page.tsx
│   │   ├── feature-flags/page.tsx
│   │   └── analytics/page.tsx
│   └── api/
│       └── paddle/
│           ├── checkout/route.ts
│           ├── portal/route.ts
│           └── webhook/route.ts
├── config/
│   └── plans.ts                     # NEW: Plan definitions + Paddle price IDs
├── lib/
│   ├── subscription.ts              # NEW: useSubscription(), feature checks
│   └── paddle.ts                    # NEW: Paddle.js init
├── styles/
│   └── public-theme.css             # NEW: Base CSS vars for public themes
└── components/
    ├── billing/                     # NEW: UpgradeButton, BillingPortalButton
    └── themes/
        └── ProFeatureGate.tsx       # NEW: Wrapper for pro features
```

---

## Data Models

### Project
```ts
interface Project {
  id: string;
  freelancerId: string;        // Clerk user ID
  name: string;
  slug: string;                // Unique per freelancer
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Task
```ts
interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  position: number;            // For ordering within column
  createdAt: Date;
  updatedAt: Date;
}
```

### Freelancer Branding (Clerk publicMetadata)
```ts
interface Branding {
  logoUrl?: string;
  primaryColor: string;        // OKLCH or hex
  borderRadius: number;        // 0–1
  fontSans: string;            // Google Font name
  fontMono: string;            // Google Font name
  mode: 'light' | 'dark';
}

interface PublicMetadata {
  plan: 'free' | 'pro';
  features: string[];          // ['branding', 'custom_theme']
  branding?: Branding;
}
```

### Paddle Plans Config
```ts
// src/config/plans.ts
export const plans = {
  free: {
    name: 'Free',
    priceId: null,
    features: ['projects', 'tasks', 'kanban', 'public_page'],
  },
  pro: {
    name: 'Pro',
    monthlyPriceId: 'pri_xxx',     // Paddle price ID
    yearlyPriceId: 'pri_yyy',
    features: ['projects', 'tasks', 'kanban', 'public_page', 'branding', 'custom_theme'],
  },
};
```

---

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `file_uploads` | `true` | Enable file attachments on tasks |
| `signups` | `true` | Allow new freelancer registrations |
| `feedback_widget` | `true` | Show feedback modal after key actions |
| `announcements` | `true` | Show global announcements banner |

Stored in DB, managed in admin panel, checked via `featureFlags` utility.

---

## Navigation (RBAC)

**Freelancer Dashboard:**
- Overview
- Projects (list + kanban)
- Settings (Branding*, Customization, Account)
- Notifications
- Profile

**Admin Only:**
- Admin Panel (Users, Announcements, Feedback, Feature Flags, Analytics)

*Branding requires Pro plan — hidden via `access: { feature: 'branding' }` in nav config.

---

## Public Page Theming Implementation

**CSS Variables** (`src/styles/public-theme.css`):
```css
[data-theme='custom'] {
  --radius: 0.5rem;
  --primary: oklch(0 0 0);
  --font-sans: Geist, sans-serif;
  --font-mono: Geist Mono, monospace;
  --background: oklch(1 0 0);
  --foreground: oklch(0 0 0);
  /* ... other vars with defaults */
}

[data-theme='custom'].dark {
  --background: oklch(0 0 0);
  --foreground: oklch(1 0 0);
  /* ... dark defaults */
}
```

**Applied in Public Page:**
```tsx
<div data-theme="custom" style={themeStyle}>
  <PublicProjectPage />
</div>
```

---

## Implementation Priority

1. **Projects + Tasks** (adapt products + kanban)
2. **Public Page** (`/[username]/[slug]`) with default theme
3. **Paddle Integration** (webhooks, checkout, subscription sync)
4. **Branding Settings** (Pro gate, logo/color/radius/font editors)
5. **Public Page Custom Theming** (dynamic CSS vars from branding)
6. **Admin Panel** (users, feature flags, announcements)
7. **Feedback Widget** + **PostHog Analytics**
8. **Feature Flags System**

---

## Open Decisions

- [x] **Database:** Prisma + PostgreSQL
- [x] **Project slug uniqueness:** Per-freelancer
- [x] **Task positions:** Fractional indexing
- [x] **File uploads:** Local storage (feature flagged, persistent volume in prod)
- [ ] **Impersonation:** Deferred — implement at 100+ paying users
- [x] **Announcements:** Custom table + MDX