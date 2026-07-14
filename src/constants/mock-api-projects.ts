////////////////////////////////////////////////////////////////////////////////
// Mock Projects Data Store — In-memory fake data for development
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

export type ProjectMutationPayload = {
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

function generateRandomProject(userId: string, id: number): Project {
  const name = faker.commerce.productName();
  const totalTasks = faker.number.int({ min: 3, max: 15 });
  const completedTasks = faker.number.int({ min: 0, max: totalTasks });

  return {
    id: `proj_${id}`,
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

export const fakeProjects = {
  records: [] as Project[],

  initialize() {
    const sampleProjects: Project[] = [];
    // Generate projects for a demo user
    for (let i = 1; i <= 8; i++) {
      sampleProjects.push(generateRandomProject('user_demo', i));
    }
    this.records = sampleProjects;
  },

  async getProjects(filters: ProjectFilters) {
    await delay(500);
    const { userId, page = 1, limit = 10, search } = filters;

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
    const project = this.records.find((p) => p.userId === userId && p.slug === slug);
    if (!project) {
      return { success: false, data: null, message: 'Project not found' };
    }
    return { success: true, data: project, message: 'Project found' };
  },

  async getPublicProject(username: string, slug: string) {
    await delay(300);
    // In mock mode, we search across all users
    const project = this.records.find((p) => p.slug === slug);
    if (!project) {
      return { success: false, data: null, message: 'Project not found' };
    }
    return { success: true, data: project, message: 'Project found' };
  },

  async createProject(userId: string, data: ProjectMutationPayload) {
    await delay(500);
    const id = `proj_${this.records.length + 1}`;
    const slug = data.slug || slugify(data.name);

    // Check slug uniqueness per user
    const existing = this.records.find((p) => p.userId === userId && p.slug === slug);
    if (existing) {
      return { success: false, data: null, message: 'A project with this slug already exists' };
    }

    const newProject: Project = {
      id,
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

  async updateProject(id: string, data: Partial<ProjectMutationPayload>) {
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

  async deleteProject(id: string) {
    await delay(500);
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, message: 'Project not found' };
    }
    this.records.splice(index, 1);
    return { success: true, message: 'Project deleted successfully' };
  },

  async updateProjectProgress(id: string) {
    // This is called after task changes to recalculate progress
    const project = this.records.find((p) => p.id === id);
    if (project) {
      const totalTasks = project.totalTasks;
      if (totalTasks > 0) {
        project.progress = Math.round((project.completedTasks / totalTasks) * 100);
      } else {
        project.progress = 0;
      }
      project.updatedAt = new Date().toISOString();
    }
  }
};

fakeProjects.initialize();
