# Traqqy — Implementation Plan

## Strategy

Build in layers, starting with a working end-to-end skeleton for the core flow, then layer on features. Each phase produces a shippable increment.

**Priority key**: P0 = must-have for MVP, P1 = important, P2 = nice-to-have

---

## Phase 0: Project Setup & Foundation (Day 1-2)

**Goal**: Clean slate, establish patterns, configure dependencies.

### Tasks

| # | Task | Details |
|---|---|---|
| 0.1 | Explore existing demo features | Keep all starter features (Chat, Kanban, products, React Query demo, forms) as reference/inspiration for building Traqqy's UI |
| 0.2 | Configure middleware | Add `middleware.ts` with Clerk route protection for `/dashboard/*` and `/admin/*`. Public routes `/[username]/[projectSlug]` bypass auth |
| 0.3 | Add new dependencies | Install `posthog-js`, `@vercel/blob`, `@paddle/paddle-js` for analytics, file storage, and subscription checkout |
| 0.4 | Create utility types | Add `ApiResponse<T>` generic type, standardize on common response format |
| 0.5 | Install Drizzle ORM + Neon driver | `bun add drizzle-orm @neondatabase/serverless` + `bun add -D drizzle-kit`. Configure `drizzle.config.ts` with Neon connection string |
| 0.6 | Set up new mock stores | Create `mock-api-projects.ts`, `mock-api-tasks.ts`, `mock-api-branding.ts`, `mock-api-feedback.ts`, `mock-api-flags.ts` — mirror the database schema. Mock data allows frontend dev before Neon is wired up |
| 0.7 | Set up Neon project | Create a Neon project (free tier: 0.5GB storage, no credit card required). Get connection string for `.env.local` |
| 0.8 | Set up admin role in Clerk | Configure admin role/flag in Clerk Dashboard or via metadata |

### Deliverables
- Clean project with all demo features preserved as reference
- Working auth middleware
- Mock data stores for all entities
- Neon project created and connected
- Admin role ready

### Verification
- `bun run dev` starts without errors
- Sign in/out flow works
- Admin role detectable via `auth().has()`
- Drizzle can connect to Neon (`bun run db:generate` runs cleanly)

---

## Phase 1: Core Flow — Projects & Tasks (Day 3-6)

**Goal**: Freelancer can create projects, manage tasks, see progress.

### Tasks

| # | Task | Priority |
|---|---|---|
| 1.1 | Create `features/projects/` module | P0 |
| 1.2 | Create project types, service, queries — `types.ts`, `service.ts`, `queries.ts` | P0 |
| 1.3 | Build project creation page (`/dashboard/projects/new`) | P0 |
| Form: name, slug (auto-gen with edit), description, initial tasks | |
| 1.4 | Build project list page (`/dashboard/projects`) | P0 |
| Cards or table showing all projects with progress | |
| 1.5 | Build single project view (`/dashboard/projects/[projectId]`) | P0 |
| Project header: name, description, progress, public URL + copy button | |
| 1.6 | Build **List view** for tasks | P0 |
| Standard todo list: add task inline, edit, delete, status dropdown | |
| 1.7 | Build **Kanban view** for tasks | P0 |
| Three columns (Pending / In Progress / Completed), drag-and-drop between columns via dnd-kit (already in deps) | |
| 1.8 | Build **View switcher** (List ↔ Kanban) | P0 |
| Toggle button pair, persisted in URL search param or local state | |
| 1.9 | Implement progress calculation and display | P0 |
| Progress bar component, `X/Y completed` text, auto-recalculates on task status change | |
| 1.10 | Add navigation items for projects | P0 |
| Update `nav-config.ts` with Projects section | |
| 1.11 | Wire up public URL slug + copy button | P0 |
| Slug display + copy to clipboard + "Open public page" link | |

### Deliverables
- Working project CRUD
- Working task CRUD with status management
- List + Kanban views switchable
- Progress bar updates in real-time
- Public URL shown with copy button

### Verification
- Create project → redirected to project view
- Add tasks, change status, see progress update
- Switch between list and kanban views
- Drag tasks between kanban columns
- Copy button copies correct URL

---

## Phase 2: Public Page (Day 7-9)

**Goal**: Client can view project progress without signing up.

### Tasks

| # | Task | Priority |
|---|---|---|
| 2.1 | Create public page route `/[username]/[projectSlug]` | P0 |
| Server component, SSR, no auth | |
| 2.2 | Build public page service layer | P0 |
| Fetch project + tasks + freelancer info by username + slug | |
| 2.3 | Build public page UI | P0 |
| Project name, description, freelancer name, progress bar, task list | |
| 2.4 | Add public email display (defaults to account email) | P1 |
| Allow override via settings later | |
| 2.5 | Add SEO metadata for public pages | P1 |
| Dynamic title, description, og:image | |
| 2.6 | Add logo display (conditional, Pro only) | P1 |
| Shows logo if user has Pro plan + uploaded logo | |
| 2.7 | Add public page theming (conditional, Pro only) | P1 |
| Apply DB-stored branding config as CSS variables | |

### Deliverables
- Public page accessible without auth
- Shows project info, progress, tasks
- SEO meta tags
- Branding placeholder for Pro

### Verification
- Open `/{username}/{projectSlug}` in incognito → works
- Progress matches freelancer's view
- No auth prompt or redirect

---

## Phase 3: Settings & Account Management (Day 10-12)

**Goal**: Freelancer can manage their account, preferences, and branding.

### Tasks

| # | Task | Priority |
|---|---|---|
| 3.1 | Create settings page structure (`/dashboard/settings`) | P0 |
| Tabbed or sectioned layout: Account, Branding (Pro), Appearance | |
| 3.2 | Build account settings section | P0 |
| Name, username, email editing; account deletion with confirmation | |
| 3.3 | Build appearance settings section | P0 |
| Dashboard theme selector (reuse existing ThemeSelector), dark/light mode | |
| 3.4 | Create branding feature module (`features/branding/`) | P1 |
| Types, service, queries for branding config | |
| 3.5 | Build branding settings form (Pro only) | P1 |
| Color picker (primary, background), font selector, border radius slider, logo upload | |
| 3.6 | Build public email setting (Pro only) | P1 |
| Text input, defaults to account email | |
| 3.7 | Add plan gating to branding UI | P1 |
| Show upgrade prompt if on Free plan | |

### Deliverables
- Settings page with working account management
- Appearance settings integrate with existing theme system
- Branding form (gated behind Pro)
- Account deletion

### Verification
- Change name → reflects in dashboard
- Change dashboard theme → header dropdown + settings stay in sync
- Branding form shows upgrade prompt on Free plan
- Delete account → redirects to sign-in, data inaccessible

---

## Phase 4: Billing & Plans (Day 13-14)

**Goal**: Freelancer can subscribe to Pro plan; plan gating works throughout app.

### Tasks

| # | Task | Priority |
|---|---|---|
| 4.1 | Set up Paddle integration | P0 |
| Configure products/plans in Paddle Dashboard: Free (3 projects) and Pro (unlimited) | |
| 4.2 | Build billing page (`/dashboard/billing`) | P0 |
| Show plans from DB, use Paddle.js checkout for subscriptions, highlight current plan | |
| 4.3 | Add plan-based gating to branding page | P0 |
| Check `user.plan` from DB on branding route and components | |
| 4.4 | Add plan-based gating to project limits | P0 |
| Free plan: max 3 projects. Show upgrade prompt when limit reached | |
| 4.5 | Add plan badge to sidebar/user menu | P1 |
| Show "Free" or "Pro" badge next to user name | |

### Deliverables
- Working billing page with plan selection
- Free plan limited to 3 projects
- Branding gated behind Pro
- Plan badge visible

### Verification
- Subscribe to Pro → branding form unlocks
- Create 4th project on Free → shown upgrade prompt
- Downgrade to Free → branding config preserved but not applied
- Cancel subscription → downgraded at period end

---

## Phase 5: Admin Panel (Day 15-18)

**Goal**: Full admin panel for platform management.

### Tasks

| # | Task | Priority |
|---|---|---|
| 5.1 | Create admin layout (`/admin/layout.tsx`) | P0 |
| Admin sidebar (separate nav config), admin role gate | |
| 5.2 | Create admin nav config | P0 |
| Users, Announcements, Feedback, Feature Flags, Analytics | |
| 5.3 | Build user management page | P0 |
| Data table (reuse pattern from existing users feature), view user detail, change plan, suspend, delete | |
| 5.4 | Build impersonation feature | P2 |
| Admin clicks "Impersonate" → gets a temporary session as that user | |
| 5.5 | Create feature flags page | P0 |
| Toggle switches for: file_uploads, account_creation, feedback_widget | |
| 5.6 | Create beta flags page | P1 |
| Toggle switches for beta features, with last-updated info | |
| 5.7 | Create announcements page | P1 |
| Form to create announcement, list of active/past announcements, toggle active | |
| 5.8 | Create feedback viewer page | P2 |
| Table of all feedback submissions, filterable by source/type | |
| 5.9 | Integrate PostHog dashboard | P2 |
| Embed PostHog dashboard or create simple analytics page in-house | |
| 5.10 | Add admin nav items to sidebar | P0 |
| Only visible to users with admin role | |

### Deliverables
- Working admin panel at `/admin`
- User management (view, change plan, suspend, delete)
- Feature flags + beta flags
- Announcements CRUD
- Feedback viewer
- PostHog analytics

### Verification
- Non-admin users get redirected from `/admin`
- Change a user's plan → reflected in their dashboard
- Toggle feature flag off → affected UI disappears immediately
- Create announcement → appears in user dashboards
- Submit feedback → visible in admin panel

---

## Phase 6: Feedback System (Day 19-20)

**Goal**: In-app feedback collection with floating button and milestone triggers.

### Tasks

| # | Task | Priority |
|---|---|---|
| 6.1 | Create feedback feature module | P1 |
| Types, service, queries | |
| 6.2 | Build floating feedback button | P1 |
| Fixed bottom-right button, opens a modal with form | |
| 6.3 | Build milestone trigger system | P1 |
| Zustand store to track completed milestones, show non-blocking prompt | |
| 6.4 | Define milestone triggers | P1 |
| First project created, first project reaches 100%, first public link shared | |
| 6.5 | Wire feature flag into feedback system | P0 |
| `useFeatureFlag('feedback_widget')` — if off, no feedback UI renders | |
| 6.6 | Add feedback API route for submission | P1 |
| POST endpoint that stores feedback in mock/real DB | |

### Deliverables
- Floating feedback button (when flag is on)
- Milestone prompts after key actions
- Feedback stored and viewable in admin

### Verification
- Feature flag ON → feedback button visible
- Feature flag OFF → no feedback UI anywhere
- Create first project → milestone prompt appears
- Submit feedback → appears in admin feedback viewer

---

## Phase 7: Polish & Launch Prep (Day 21-23)

**Goal**: Production-ready.

### Tasks

| # | Task | Priority |
|---|---|---|
| 7.1 | Error boundaries for each route group | P1 |
| Custom error pages for projects, admin, public page | |
| 7.2 | Loading skeletons | P1 |
| Skeleton components for project list, task views, admin tables | |
| 7.3 | Empty states | P1 |
| "No projects yet — create your first project" etc. | |
| 7.4 | Toast notifications for all mutations | P1 |
| Success/error toasts on create, update, delete | |
| 7.5 | Responsive review | P1 |
| Ensure all pages work on tablet/mobile | |
| 7.6 | SEO check on public pages | P1 |
| Meta tags, structured data, Open Graph | |
| 7.7 | Performance audit | P1 |
| Lighthouse scores, bundle analysis, image optimization | |
| 7.8 | Final cleanup | P1 |
| Remove unused files, update nav config, verify all routes | |
| 7.9 | Deploy to Vercel | P0 |
| Set env vars, enable Blob storage, verify production build | |

### Deliverables
- Production-ready app deployed to Vercel
- Error states, loading states, empty states all handled
- Responsive on all devices

---

## Summary Timeline

| Phase | Days | Effort | Key Deliverable |
|---|---|---|---|
| 0: Setup | 2 | ⭐ | Clean project + patterns |
| 1: Core Flow | 4 | ⭐⭐⭐⭐⭐ | Projects + tasks + progress |
| 2: Public Page | 3 | ⭐⭐⭐ | Client-facing progress page |
| 3: Settings | 3 | ⭐⭐⭐ | Account + branding |
| 4: Billing | 2 | ⭐⭐ | Plans + gating |
| 5: Admin Panel | 4 | ⭐⭐⭐⭐⭐ | Full admin control |
| 6: Feedback | 2 | ⭐⭐ | Feedback collection |
| 7: Polish | 3 | ⭐⭐⭐ | Production-ready |

**Total**: ~23 days (all phases) | **MVP** (Phases 0-2): ~9 days

## Dependencies Map

```
Phase 0 (Setup)
  └──► Phase 1 (Projects & Tasks)
         ├──► Phase 2 (Public Page)
         └──► Phase 3 (Settings)
                └──► Phase 4 (Billing & Plans) ◄── depends on Phase 3 branding
         └──► Phase 5 (Admin Panel) ◄── can parallel with 2-4
         └──► Phase 6 (Feedback) ◄── depends on Phase 1 milestones
                └──► Phase 7 (Polish) ◄── all phases complete
```

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scope creep (adding features mid-build) | Medium | Strict phase gates; no new features after Phase 1 starts |
| Paddle integration complexity | Medium | Need Paddle.js checkout, webhook receiver, and plan sync logic |
| Kanban DnD performance with many tasks | Low | dnd-kit already in deps; virtualize if needed |
| Public page load speed | Low | SSR + no JS needed; Edge cache via Vercel |
| User impersonation security | Medium | Only admin can impersonate; audited; session expiry |
| Feature flag edge cases (server vs client sync) | Medium | Fetch flags on both server + client; default to OFF |
