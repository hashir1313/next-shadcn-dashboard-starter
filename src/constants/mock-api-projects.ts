////////////////////////////////////////////////////////////////////////////////
// Mock Projects Data Store — In-memory fake data for development
// Automatically generates mock projects for any userId on first access
//////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { delay } from './mock-api';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type Project = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFilters = {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type ProjectCreatePayload = {
  name: string;
  slug?: string;
  description?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

let idCounter = 100;

function generateRandomProject(userId: string): Project {
  const name = faker.commerce.productName();
  const totalTasks = faker.number.int({ min: 3, max: 15 });
  const completedTasks = faker.number.int({ min: 0, max: totalTasks });
  idCounter++;

  return {
    id: `proj_${idCounter}`,
    userId,
    name,
    slug: slugify(name),
    description: faker.lorem.sentence(),
    totalTasks,
    completedTasks,
    progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    createdAt: faker.date.between({ from: '2024-01-01', to: '2025-12-31' }).toISOString(),
    updatedAt: faker.date.recent().toISOString()
  };
}

function generateProjectsForUser(userId: string): Project[] {
  const count = faker.number.int({ min: 4, max: 8 });
  const projects: Project[] = [];
  for (let i = 0; i < count; i++) {
    projects.push(generateRandomProject(userId));
  }
  return projects;
}

export const fakeProjects = {
  records: [] as Project[],
  seededUsers: new Set<string>(),

  ensureSeeded(userId: string) {
    if (!this.seededUsers.has(userId)) {
      this.seededUsers.add(userId);
      const projects = generateProjectsForUser(userId);
      this.records.push(...projects);
    }
  },

  async getProjects(filters: ProjectFilters) {
    await delay(500);
    const { userId, page = 1, limit = 10, search } = filters;

    this.ensureSeeded(userId);

    let projects = this.records.filter((p) => p.userId === userId);

    if (search) {
      const q = search.toLowerCase();
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    const total = projects.length;
    const offset = (page - 1) * limit;
    const paginated = projects.slice(offset, offset + limit);

    return {
      success: true,
      data: paginated,
      total,
      page,
      limit,
      message: 'Projects fetched successfully'
    };
  },

  async getProjectById(id: string) {
    await delay(300);
    const project = this.records.find((p) => p.id === id);
    if (!project) {
      return { success: false, data: null, message: 'Project not found' };
    }
    return { success: true, data: project, message: 'Project found' };
  },

  async getProjectBySlug(userId: string, slug: string) {
    await delay(300);
    this.ensureSeeded(userId);
    const project = this.records.find((p) => p.userId === userId && p.slug === slug);
    if (!project) {
      return { success: false, data: null, message: 'Project not found' };
    }
    return { success: true, data: project, message: 'Project found' };
  },

  async getPublicProject(username: string, slug: string) {
    await delay(300);
    const project = this.records.find((p) => p.slug === slug);
    if (!project) {
      return { success: false, data: null, message: 'Project not found' };
    }
    return { success: true, data: project, message: 'Project found' };
  },

  async createProject(userId: string, data: ProjectCreatePayload) {
    await delay(500);
    this.ensureSeeded(userId);

    const slug = data.slug || slugify(data.name);
    const existing = this.records.find((p) => p.userId === userId && p.slug === slug);
    if (existing) {
      return { success: false, data: null, message: 'A project with this slug already exists' };
    }

    idCounter++;
    const newProject: Project = {
      id: `proj_${idCounter}`,
      userId,
      name: data.name,
      slug,
      description: data.description || '',
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.records.push(newProject);
    return { success: true, data: newProject, message: 'Project created successfully' };
  },

  async updateProject(id: string, data: Partial<ProjectCreatePayload>) {
    await delay(500);
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, data: null, message: 'Project not found' };
    }

    if (data.name) {
      this.records[index].name = data.name;
    }
    if (data.slug) {
      this.records[index].slug = data.slug;
    }
    if (data.description !== undefined) {
      this.records[index].description = data.description;
    }
    this.records[index].updatedAt = new Date().toISOString();

    return { success: true, data: this.records[index], message: 'Project updated successfully' };
  },

  async updateProjectCounts(id: string, totalTasks: number, completedTasks: number) {
    const index = this.records.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.records[index].totalTasks = totalTasks;
      this.records[index].completedTasks = completedTasks;
      this.records[index].progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      this.records[index].updatedAt = new Date().toISOString();
    }
  },

  async deleteProject(id: string) {
    await delay(500);
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, message: 'Project not found' };
    }
    this.records.splice(index, 1);
    return { success: true, message: 'Project deleted successfully' };
  }
};
