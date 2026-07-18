# Traqqy — Product Brief

## Elevator Pitch

**Traqqy** is a client progress-sharing tool built for freelancers. It turns project management into a transparent, shareable experience — freelancers manage their projects and tasks internally, while clients see real-time progress on a public page. No client sign-up required.

## Core Value Proposition

Freelancers struggle with one recurring question from clients: *"How's the project going?"* Traqqy eliminates that friction by giving clients a live, branded progress page they can visit anytime. The freelancer gets a clean project management tool; the client gets transparency.

## Target Audience

- **Primary**: Solo freelancers (designers, developers, writers, consultants, marketers)
- **Secondary**: Small freelance agencies (2-5 people) who want a simple client portal
- **Admin**: The platform owner (you) manages users, plans, and system settings

## Key Differentiators

| Traqqy | Other PM Tools |
|---|---|
| Public progress page for clients — no account needed | Clients need to sign up and learn a new tool |
| Freelancer-first design — simple, focused | Enterprise-focused, overloaded with features |
| Branded public pages (paid feature) | White-labeling is expensive or unavailable |
| Built for sharing progress, not managing teams | Built for internal team collaboration |
| Lightweight — tasks, progress, share | Heavy — sprints, epics, dependencies, Gantt charts |

## High-Level Feature Overview

### Freelancer Dashboard (Free)
- Account creation via Better Auth (email, Google)
- Project CRUD (name, slug, description, tasks)
- Task management with 3 states: Pending → In Progress → Completed
- Progress calculation: `(Completed / Total) × 100`
- Dual task views: List view + Kanban view (switchable like Notion)
- Public URL with copy button
- Dashboard theme selection (10 themes, cookie-based)

### Settings (Free)
- Account management (name, email, password)
- Dashboard theme + dark/light mode

### Settings (Paid — Pro Plan)
- **Branding settings**: Logo upload, colors, border radius, fonts for public page
- **Public email**: Override account email for client-facing display

### Public Client Page (Free to view, branded if Freelancer is Pro)
- Route: `/{username}/{project-slug}`
- Shows: project name, description, freelancer name/logo (paid), progress bar, percentage, task list
- No authentication required
- Public page theme stored in DB (paid feature controls customization)

### Admin Panel (`/admin`)
- User management: view profile, change plan, delete, suspend, impersonate
- Announcements: create and broadcast
- Feedback: collected from users via floating button + milestone triggers
- Feature flags: toggle file uploads, account creation, feedback widget ON/OFF
- Beta flags: toggle new features in production (kill switch for broken features)
- Analytics: PostHog integration

### Billing
- Plans managed via Paddle (subscription management + payment processing)
- Paddle webhooks update user plan in the application database
- Free tier: core project management + 3 projects
- Pro tier: branding, custom themes, unlimited projects, logo upload

### Feedback System
- **Always-on**: Floating feedback button (subtle, non-intrusive)
- **Milestone-triggered**: Small non-blocking toasts after key actions (first project created, first 100% project, first public link shared)
- Controlled by feature flag — OFF means zero feedback UI anywhere

## Two Theme Systems

1. **Dashboard Theme** (Freelancer's own UI): Selected from header dropdown, uses existing 10-theme system (cookie-based). Free.
2. **Public Page Theme** (Client-facing branding): Configured in Settings (branding tab). Stored in database. Includes colors, fonts, border radius. Paid feature.

## Business Model

- **Free tier**: Core task management, dashboard theming, unlimited public page views, 3 projects
- **Pro tier** ($X/month): Unlimited projects, branded public pages, custom themes, logo upload, priority support

## Success Metrics

- Freelancer sign-ups
- Projects created per user
- Public page views (client engagement)
- Free → Pro conversion rate
- Feedback response rate

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL on Neon (serverless) via Drizzle ORM |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Base UI |
| Auth | Better Auth (self-hosted, Drizzle adapter) |
| Data Fetching | TanStack React Query |
| Forms | TanStack Form + Zod |
| Tables | TanStack Table |
| Icons | @tabler/icons-react (via centralized registry) |
| Charts | Recharts |
| Analytics | PostHog |
| Error Tracking | Sentry |
| ORM | Drizzle (type-safe, works great with Neon serverless) |
| Package Manager | Bun (preferred) / npm |
| Containerization | Docker (Node.js & Bun) |
| File Storage | Vercel Blob (250MB free on Hobby, pay-as-you-go on Pro) |
| Hosting | Vercel (Hobby: free, Pro: $20/mo with $100 in usage credits) |
