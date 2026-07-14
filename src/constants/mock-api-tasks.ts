////////////////////////////////////////////////////////////////////////////////
// Mock Tasks Data Store — In-memory fake data for development
//////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { delay } from './mock-api';
import type { TaskStatus } from './mock-api-projects';

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskMutationPayload = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

function generateRandomTask(projectId: string, position: number): Task {
  const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
  return {
    id: `task_${faker.string.uuid().slice(0, 8)}`,
    projectId,
    title: faker.hacker.phrase(),
    description: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(statuses),
    position,
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString()
  };
}

export const fakeTasks = {
  records: [] as Task[],

  initialize() {
    // Generate tasks for each demo project
    const projects = [
      'proj_1',
      'proj_2',
      'proj_3',
      'proj_4',
      'proj_5',
      'proj_6',
      'proj_7',
      'proj_8'
    ];

    for (const projectId of projects) {
      const taskCount = faker.number.int({ min: 3, max: 8 });
      for (let i = 0; i < taskCount; i++) {
        this.records.push(generateRandomTask(projectId, i));
      }
    }
  },

  async getTasks(projectId: string) {
    await delay(300);
    const tasks = this.records
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => a.position - b.position);
    return tasks;
  },

  async getTaskById(id: string) {
    await delay(200);
    return this.records.find((t) => t.id === id) || null;
  },

  async createTask(projectId: string, data: TaskMutationPayload) {
    await delay(400);
    const maxPosition = Math.max(
      0,
      ...this.records.filter((t) => t.projectId === projectId).map((t) => t.position)
    );

    const newTask: Task = {
      id: `task_${faker.string.uuid().slice(0, 8)}`,
      projectId,
      title: data.title,
      description: data.description || '',
      status: data.status || 'pending',
      position: maxPosition + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.records.push(newTask);
    return newTask;
  },

  async updateTask(id: string, data: Partial<TaskMutationPayload>) {
    await delay(400);
    const index = this.records.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    if (data.title !== undefined) {
      this.records[index].title = data.title;
    }
    if (data.description !== undefined) {
      this.records[index].description = data.description;
    }
    if (data.status !== undefined) {
      this.records[index].status = data.status;
    }
    this.records[index].updatedAt = new Date().toISOString();

    return this.records[index];
  },

  async updateTaskStatus(id: string, status: TaskStatus) {
    await delay(300);
    const index = this.records.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    this.records[index].status = status;
    this.records[index].updatedAt = new Date().toISOString();

    return this.records[index];
  },

  async deleteTask(id: string) {
    await delay(400);
    const index = this.records.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }
    this.records.splice(index, 1);
  },

  async reorderTasks(projectId: string, taskIds: string[]) {
    await delay(400);
    for (let i = 0; i < taskIds.length; i++) {
      const index = this.records.findIndex((t) => t.id === taskIds[i]);
      if (index !== -1) {
        this.records[index].position = i;
        this.records[index].updatedAt = new Date().toISOString();
      }
    }
    return this.records
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  }
};

fakeTasks.initialize();
