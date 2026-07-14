import { pgTable, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// ============================================================================
// Enums
// ============================================================================

export const userPlanEnum = pgEnum('user_plan', ['free', 'pro']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deleted']);
export const dashboardModeEnum = pgEnum('dashboard_mode', ['light', 'dark', 'system']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed']);
export const feedbackSourceEnum = pgEnum('feedback_source', ['floating_button', 'milestone']);

// ============================================================================
// Users
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk userId
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  publicEmail: text('public_email'),
  logoUrl: text('logo_url'),
  plan: userPlanEnum('plan').notNull().default('free'),
  status: userStatusEnum('status').notNull().default('active'),
  dashboardTheme: text('dashboard_theme').notNull().default('vercel'),
  dashboardMode: dashboardModeEnum('dashboard_mode').notNull().default('system'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// ============================================================================
// Projects
// ============================================================================

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  totalTasks: integer('total_tasks').notNull().default(0),
  completedTasks: integer('completed_tasks').notNull().default(0),
  progress: integer('progress').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// ============================================================================
// Tasks
// ============================================================================

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('pending'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// ============================================================================
// Branding Config (Pro only, 1:1 with User)
// ============================================================================

export const brandingConfigs = pgTable('branding_configs', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  primaryColor: text('primary_color').notNull().default('#000000'),
  backgroundColor: text('background_color').notNull().default('#ffffff'),
  fontFamily: text('font_family').notNull().default('inter'),
  borderRadius: integer('border_radius').notNull().default(8),
  logoUrl: text('logo_url'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// ============================================================================
// Announcements
// ============================================================================

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  linkUrl: text('link_url'),
  linkText: text('link_text'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at')
});

// ============================================================================
// Feedback
// ============================================================================

export const feedback = pgTable('feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  projectId: text('project_id').references(() => projects.id),
  source: feedbackSourceEnum('source').notNull(),
  type: text('type'), // milestone type: 'first_project', 'first_100_percent', 'first_public_link'
  rating: integer('rating'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// ============================================================================
// Feature Flags
// ============================================================================

export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by')
});

// ============================================================================
// Beta Flags
// ============================================================================

export const betaFlags = pgTable('beta_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by')
});
