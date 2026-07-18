# Traqqy — Database Schema

## 1. Overview

Traqqy uses the service layer pattern from the starter template, where the database is abstracted behind `service.ts` files. The schema below represents the domain entities for **PostgreSQL** hosted on **Neon** (serverless Postgres).

**File storage**: User-uploaded assets (logos) are stored in **Vercel Blob**. The database stores only the blob URL string — not the file itself.

During initial development, all data will use **in-memory mock stores** matching this schema. When connecting Neon, only `service.ts` files change (swap mock calls for Drizzle ORM queries against Neon Postgres).

## 2. Entity Relationship Diagram

```
User ──1:N──▶ Project ──1:N──▶ Task
  │
  ├──1:1──▶ BrandingConfig (Pro only)
  │
  ├──1:1──▶ UserSettings
  │
  └──1:1──▶ Subscription (via Paddle webhooks)

Admin ──1:N──▶ Announcement
Admin ──1:N──▶ FeatureFlag
Admin ──1:N──▶ BetaFlag

Feedback ──N:1──▶ User
Feedback ──N:1──▶ Project (nullable)
```

## 3. Entity Definitions

### User

Represents a freelancer account. Uses Better Auth's `user` table with Traqqy-specific fields.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (Better Auth UUID) | Primary key |
| `name` | `string` | Display name |
| `email` | `string` | Unique email |
| `emailVerified` | `boolean` | Email verification status |
| `image` | `string?` | Profile image URL |
| `username` | `string` | Unique, URL-safe slug for public page |
| `publicEmail` | `string?` | Override email for public page; defaults to account email |
| `logoUrl` | `string?` | Logo URL (Pro feature) |
| `plan` | `enum: 'free' | 'pro'` | Current subscription plan |
| `status` | `enum: 'active' | 'suspended' | 'deleted'` | Account status |
| `dashboardTheme` | `string` | Theme preference (e.g., 'vercel', 'claude') |
| `dashboardMode` | `enum: 'light' | 'dark' | 'system'` | Dark/light preference |
| `createdAt` | `timestamp` | Account creation date |
| `updatedAt` | `timestamp` | Last update date |

```typescript
// src/features/users/api/types.ts
export interface User {
  id: string;                    // Better Auth UUID
  name: string;                  // Display name
  email: string;                 // Unique email
  emailVerified: boolean;
  image?: string;
  username: string;              // Unique per user
  publicEmail?: string;          // Override for public page
  logoUrl?: string;              // Pro feature
  plan: 'free' | 'pro';
  status: 'active' | 'suspended' | 'deleted';
  dashboardTheme: string;        // e.g., 'vercel'
  dashboardMode: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}
```

### Project

A project owned by a freelancer containing tasks.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `userId` | `string` (FK → User.id) | Owner |
| `name` | `string` | Project name |
| `slug` | `string` | URL-safe slug, unique per user |
| `description` | `string?` | Optional project description |
| `totalTasks` | `number` | Total task count (denormalized for perf) |
| `completedTasks` | `number` | Completed task count (denormalized) |
| `progress` | `number` | `(completed / total) × 100` or 0 if no tasks |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

```typescript
// src/features/projects/api/types.ts
export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;                  // Unique per userId
  description?: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;              // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilters {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface ProjectMutationPayload {
  name: string;
  slug?: string;                 // Auto-generated if not provided
  description?: string;
  tasks?: TaskMutationPayload[]; // Optional initial tasks
}
```

### Task

A task belonging to a project.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `projectId` | `string` (FK → Project.id) | Parent project |
| `title` | `string` | Task title |
| `description` | `string?` | Optional task description |
| `status` | `enum: 'pending' | 'in_progress' | 'completed'` | Current status |
| `position` | `number` | Ordering position (for drag reorder) |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

```typescript
// src/features/tasks/api/types.ts
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMutationPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
}
```

### BrandingConfig

Public page branding configuration. Only available on Pro plan. Stored per user (one-to-one) — a single branding config applies to all of a freelancer's public pages.

| Field | Type | Description |
|---|---|---|
| `userId` | `string` (PK, FK → User.id) | One-to-one with user |
| `primaryColor` | `string` | Hex color (e.g., `'#000000'`) |
| `backgroundColor` | `string` | Hex color (e.g., `'#ffffff'`) |
| `fontFamily` | `string` | Font key, references a predefined font set (e.g., `'inter'`, `'dm-sans'`) |
| `borderRadius` | `number` | Border radius in pixels (e.g., `8`) |
| `logoUrl` | `string?` | Uploaded logo URL (stored in Vercel Blob) |
| `updatedAt` | `timestamp` | |

```typescript
// src/features/branding/api/types.ts
export interface BrandingConfig {
  userId: string;
  primaryColor: string;          // e.g., '#000000'
  backgroundColor: string;       // e.g., '#ffffff'
  fontFamily: string;            // font key, e.g., 'inter', 'dm-sans'
  borderRadius: number;          // in pixels, e.g., 8
  logoUrl?: string;
}

export interface BrandingMutationPayload {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  logoUrl?: string;
}
```

### Announcement

System-wide announcements created by the admin.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `title` | `string` | Announcement title |
| `message` | `string` | Announcement body |
| `linkUrl` | `string?` | Optional link |
| `linkText` | `string?` | Link button text |
| `isActive` | `boolean` | Whether announcement is currently shown |
| `createdAt` | `timestamp` | |
| `expiresAt` | `timestamp?` | Optional auto-hide date |

```typescript
// src/features/announcements/api/types.ts
export interface Announcement {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}
```

### Feedback

User-submitted feedback, either via floating button or milestone triggers.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `userId` | `string` (FK → User.id) | Submitting user |
| `projectId` | `string?` (FK → Project.id) | Related project (if milestone-triggered) |
| `source` | `enum: 'floating_button' | 'milestone'` | How it was submitted |
| `type` | `string?` | Milestone type (e.g., 'first_project', 'first_100_percent') |
| `rating` | `number?` | Optional rating (1-5) |
| `message` | `string` | Free-text feedback |
| `createdAt` | `timestamp` | |

```typescript
// src/features/feedback/api/types.ts
export type FeedbackSource = 'floating_button' | 'milestone';
export type MilestoneType = 'first_project' | 'first_100_percent' | 'first_public_link';

export interface Feedback {
  id: string;
  userId: string;
  projectId?: string;
  source: FeedbackSource;
  type?: MilestoneType;
  rating?: number;
  message: string;
  createdAt: string;
}
```

### FeatureFlag

System-wide feature flags controlled from the admin panel.

| Field | Type | Description |
|---|---|---|
| `key` | `string` (PK) | Unique flag key (e.g., 'file_uploads', 'account_creation', 'feedback_widget') |
| `enabled` | `boolean` | Whether feature is active |
| `description` | `string` | Human-readable description |
| `updatedAt` | `timestamp` | |
| `updatedBy` | `string` (FK → Admin) | Who last changed it |

```typescript
// src/features/admin/api/types.ts
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export type FeatureFlagKey = 
  | 'file_uploads'
  | 'account_creation' 
  | 'feedback_widget';
```

### BetaFlag

Toggle for beta features — acts as a kill switch.

| Field | Type | Description |
|---|---|---|
| `key` | `string` (PK) | Unique flag key |
| `enabled` | `boolean` | Whether beta feature is active |
| `description` | `string` | What this beta feature does |
| `updatedAt` | `timestamp` | |
| `updatedBy` | `string` (FK → Admin) | |

```typescript
export interface BetaFlag {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
}
```

## 4. Mock Data Store Interface

During prototyping, each entity has a corresponding mock store:

```typescript
// src/constants/mock-api-projects.ts
export const fakeProjects = {
  getProjects: (filters: ProjectFilters) => Promise<ProjectsResponse>,
  getProjectById: (id: string) => Promise<ProjectResponse>,
  getProjectBySlug: (username: string, slug: string) => Promise<ProjectResponse>,
  createProject: (userId: string, data: ProjectMutationPayload) => Promise<ProjectResponse>,
  updateProject: (id: string, data: Partial<Project>) => Promise<ProjectResponse>,
  deleteProject: (id: string) => Promise<{ success: boolean }>
};

// src/constants/mock-api-tasks.ts
export const fakeTasks = {
  getTasks: (projectId: string) => Promise<Task[]>,
  createTask: (projectId: string, data: TaskMutationPayload) => Promise<Task>,
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>,
  deleteTask: (id: string) => Promise<void>,
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task>,
  reorderTasks: (projectId: string, taskIds: string[]) => Promise<Task[]>
};

// src/constants/mock-api-branding.ts
export const fakeBranding = {
  getBranding: (userId: string) => Promise<BrandingConfig | null>,
  upsertBranding: (userId: string, data: BrandingMutationPayload) => Promise<BrandingConfig>
};

// src/constants/mock-api-feedback.ts
export const fakeFeedback = {
  getFeedback: (filters: FeedbackFilters) => Promise<Feedback[]>,
  createFeedback: (data: FeedbackMutationPayload) => Promise<Feedback>
};

// src/constants/mock-api-announcements.ts
export const fakeAnnouncements = {
  getActiveAnnouncements: () => Promise<Announcement[]>,
  createAnnouncement: (data: Announcement) => Promise<Announcement>,
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<Announcement>,
  deleteAnnouncement: (id: string) => Promise<void>
};

// src/constants/mock-api-flags.ts
export const fakeFeatureFlags = {
  getAll: () => Promise<FeatureFlag[]>,
  get: (key: string) => Promise<FeatureFlag>,
  set: (key: string, enabled: boolean) => Promise<FeatureFlag>
};

export const fakeBetaFlags = {
  getAll: () => Promise<BetaFlag[]>,
  set: (key: string, enabled: boolean) => Promise<BetaFlag>
};
```

## 5. Key Queries

```typescript
// Public page query — server-side, no auth
const publicProjectQuery = async (username: string, slug: string): Promise<{
  project: Project;
  tasks: Task[];
  freelancer: { displayName: string; publicEmail: string; logoUrl?: string };
  branding?: BrandingConfig; // Only if Pro
}>;

// Freelancer project list query
const projectKeys = {
  all: ['projects'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.all, 'list', filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

// Feature flag check
const featureFlagKeys = {
  all: ['feature-flags'] as const,
  detail: (key: string) => [...featureFlagKeys.all, key] as const,
};
```

## 6. Indexes & Constraints

| Entity | Index/Constraint | Reason |
|---|---|---|
| User | `username` UNIQUE | Public URL uniqueness |
| Project | `(userId, slug)` UNIQUE | Slug unique per user |
| Project | `userId` INDEX | List user's projects |
| Task | `projectId` INDEX | List project's tasks |
| Task | `(projectId, position)` INDEX | Ordering |
| BrandingConfig | `userId` PK (1:1 with User) | One branding config per user |
| Feedback | `userId` INDEX | Admin filtering |
| FeatureFlag | `key` PK | Upsert pattern |
