# Traqqy — Product Requirements Document

## 1. Overview

Traqqy is a SaaS application that lets freelancers manage projects and share live progress with clients via a public, no-signup page. The platform includes a freelancer dashboard, a client-facing public page, a user settings area, a billing system, and an admin panel.

## 2. User Roles

| Role | Description |
|---|---|
| **Freelancer** | Primary user. Creates projects, manages tasks, shares public links, configures branding (Pro). |
| **Client (Viewer)** | Visits public project pages. No account required. Sees progress and tasks read-only. |
| **Admin** | Platform owner. Manages users, plans, announcements, feedback, feature flags, beta flags, analytics. |

## 3. Functional Requirements

### 3.1 Authentication & Onboarding

| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | Freelancer can sign up using email/password and OAuth (Google) via Better Auth | P0 |
| AUTH-2 | Freelancer can sign in with existing account | P0 |
| AUTH-3 | Freelancer can sign out | P0 |
| AUTH-4 | Freelancer can reset password via Better Auth | P1 |
| AUTH-5 | Freelancer is redirected to `/dashboard/overview` after sign-in | P0 |
| AUTH-6 | Unauthenticated users accessing `/dashboard/*` are redirected to sign-in | P0 |

### 3.2 Dashboard — Overview

| ID | Requirement | Priority |
|---|---|---|
| DASH-1 | Freelancer sees a dashboard overview with project stats (total projects, completion rate, recent activity) | P1 |
| DASH-2 | Freelancer can switch dashboard theme via header dropdown (10 themes, cookie-persisted) | P0 |
| DASH-3 | Freelancer can toggle dark/light/mode via header toggle | P0 |

### 3.3 Projects — CRUD

| ID | Requirement | Priority |
|---|---|---|
| PROJ-1 | Freelancer can create a new project with: name (required), slug (auto-generated, customizable), description (optional) | P0 |
| PROJ-2 | Slug is auto-generated from project name, must be unique per freelancer | P0 |
| PROJ-3 | Freelancer can edit project name, slug, description | P1 |
| PROJ-4 | Freelancer can delete a project (with confirmation) | P1 |
| PROJ-5 | Freelancer can view a list of all projects | P0 |
| PROJ-6 | After creation, freelancer is redirected to the single project view page | P0 |

### 3.4 Tasks

| ID | Requirement | Priority |
|---|---|---|
| TASK-1 | Tasks belong to a project. Freelancer can add tasks during or after project creation | P0 |
| TASK-2 | Task has: title (required), description (optional), status (Pending / In Progress / Completed) | P0 |
| TASK-3 | Task status can be updated via click or drag (Kanban) | P0 |
| TASK-4 | Freelancer can reorder tasks in list view (drag and drop) | P2 |
| TASK-5 | Freelancer can edit task title and description inline | P1 |
| TASK-6 | Freelancer can delete a task | P1 |

### 3.5 Progress Calculation

| ID | Requirement | Priority |
|---|---|---|
| PROG-1 | Progress percentage = `(Completed Tasks / Total Tasks) × 100` | P0 |
| PROG-2 | Only tasks with status "Completed" count toward completion | P0 |
| PROG-3 | Progress bar and percentage displayed on project view and public page | P0 |
| PROG-4 | Display: "X/Y tasks completed" alongside progress bar | P0 |

### 3.6 Single Project View (Freelancer)

| ID | Requirement | Priority |
|---|---|---|
| SPV-1 | Page shows: project name, description, progress bar, tasks completed/total, public URL with copy button | P0 |
| SPV-2 | Two switchable task view layouts: **List view** (standard todo list) and **Kanban view** (Trello-style columns by status) | P0 |
| SPV-3 | View switcher is a toggle/button pair (like Notion database views) | P0 |
| SPV-4 | Public URL format: `/{username}/{project-slug}` | P0 |
| SPV-5 | Copy button copies the full public URL to clipboard | P0 |
| SPV-6 | Slug section has an "Open public page" link for preview | P1 |

### 3.7 Public Page (Client-Facing)

| ID | Requirement | Priority |
|---|---|---|
| PUB-1 | Public page is accessible at `/{username}/{project-slug}` without authentication | P0 |
| PUB-2 | Page shows: project name, project description, freelancer name, freelancer email (public email), progress bar, percentage, task list | P0 |
| PUB-3 | If freelancer has Pro plan and uploaded a logo, logo is displayed | P1 |
| PUB-4 | If freelancer has Pro plan and configured public page theme, it uses those colors/fonts/radius | P1 |
| PUB-5 | Task list shows all tasks with their status (read-only) | P0 |
| PUB-6 | Page is server-rendered for SEO and fast initial load | P0 |
| PUB-7 | Page uses freelancer's public email setting (defaults to account email) | P1 |

### 3.8 Settings

| ID | Requirement | Priority |
|---|---|---|
| SET-1 | Freelancer can edit name, username, email (account settings) | P0 |
| SET-2 | Freelancer can view current plan and upgrade/downgrade | P1 |
| SET-3 | Freelancer can delete their account (with confirmation and data purge) | P1 |
| SET-4 | Freelancer can select dashboard theme from the header dropdown | P0 |
| SET-5 | Freelancer can set dark/light mode preference | P0 |
| SET-6 | **Pro only**: Freelancer can upload logo (for public page) | P1 |
| SET-7 | **Pro only**: Freelancer can configure public page branding (colors, fonts, border radius) | P1 |
| SET-8 | **Pro only**: Freelancer can set a public email (separate from account email) | P1 |

### 3.9 Billing

| ID | Requirement | Priority |
|---|---|---|
| BILL-1 | Billing page shows all available plans with current plan highlighted | P0 |
| BILL-2 | Freelancer can subscribe, upgrade, downgrade, or cancel a plan | P0 |
| BILL-3 | Plans are managed via Paddle (subscription management + payment processing) | P0 |
| BILL-4 | Free plan includes: 3 projects, core features, no branding | P0 |
| BILL-5 | Pro plan includes: unlimited projects, branded public pages, custom themes, logo upload | P1 |
| BILL-6 | Paddle webhooks sync subscription status to the local database | P0 |

### 3.10 Admin Panel

| ID | Requirement | Priority |
|---|---|---|
| ADM-1 | Admin can view all users in a paginated, filterable data table | P0 |
| ADM-2 | Admin can view user details: profile pic, name, email, logo, plan | P0 |
| ADM-3 | Admin can change a user's plan | P1 |
| ADM-4 | Admin can suspend a user (prevents login) | P1 |
| ADM-5 | Admin can delete a user (with confirmation) | P1 |
| ADM-6 | Admin can impersonate a user (login as them) | P2 |
| ADM-7 | Admin panel is at `/admin` route | P0 |
| ADM-8 | Admin access is protected by admin role check | P0 |

### 3.11 Announcements

| ID | Requirement | Priority |
|---|---|---|
| ANN-1 | Admin can create announcements (title, message, optional link) | P1 |
| ANN-2 | Announcements are displayed to freelancers in the dashboard | P1 |
| ANN-3 | Freelancer can dismiss an announcement | P2 |

### 3.12 Feedback System

| ID | Requirement | Priority |
|---|---|---|
| FB-1 | A floating feedback button is shown on the dashboard (when enabled) | P1 |
| FB-2 | Milestone-triggered feedback prompts appear after: first project, first 100% project, first public link shared | P1 |
| FB-3 | Feedback prompts are non-blocking (toast/slide-in, 1-2 questions) | P1 |
| FB-4 | Feature flag controls the entire feedback system — OFF hides all feedback UI | P0 |
| FB-5 | Admin can view collected feedback in the admin panel | P2 |

### 3.13 Feature Flags & Beta Flags

| ID | Requirement | Priority |
|---|---|---|
| FF-1 | Admin can toggle feature flags: file uploads, account creation, feedback widget | P0 |
| FF-2 | Admin can toggle beta flags: new features that can be killed if broken in production | P1 |
| FF-3 | Feature flag changes apply immediately without redeployment | P1 |

### 3.14 Analytics

| ID | Requirement | Priority |
|---|---|---|
| AN-1 | PostHog is integrated for product analytics | P1 |
| AN-2 | Events tracked: sign-up, project created, task completed, public page viewed, plan change | P1 |
| AN-3 | Admin can view analytics dashboard in admin panel | P2 |

## 4. Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Public pages load in under 2 seconds (SSR + edge cache) | P0 |
| NFR-2 | Dashboard is responsive — works on desktop and tablet | P0 |
| NFR-3 | All API responses follow consistent format: `{ success, data, message }` | P1 |
| NFR-4 | Public pages are SEO-friendly (proper meta tags, semantic HTML) | P1 |
| NFR-5 | Auth-protected pages redirect immediately, no flash of content | P0 |
| NFR-6 | Progress calculations are real-time (no page refresh needed after task update) | P0 |
| NFR-7 | Freelancer data is isolated — freelancers cannot see each other's data | P0 |
| NFR-8 | Feature/beta flags are checked on server and client | P1 |

## 5. Route Map

| Route | Access | Description |
|---|---|---|
| `/auth/sign-in` | Public | Sign in page |
| `/auth/sign-up` | Public | Sign up page |
| `/dashboard/overview` | Freelancer | Dashboard overview |
| `/dashboard/projects` | Freelancer | Project listing |
| `/dashboard/projects/[projectId]` | Freelancer | Single project view (list + kanban) |
| `/dashboard/projects/new` | Freelancer | Create project |
| `/dashboard/settings` | Freelancer | Settings page |
| `/dashboard/settings/branding` | Freelancer (Pro) | Branding settings |
| `/dashboard/settings/account` | Freelancer | Account management |
| `/dashboard/billing` | Freelancer | Billing & plans |
| `/{username}/{project-slug}` | Public | Client-facing project page |
| `/admin` | Admin | Admin dashboard |
| `/admin/users` | Admin | User management |
| `/admin/announcements` | Admin | Announcements |
| `/admin/feedback` | Admin | Feedback viewer |
| `/admin/features` | Admin | Feature/beta flags |
| `/admin/analytics` | Admin | Analytics dashboard |
