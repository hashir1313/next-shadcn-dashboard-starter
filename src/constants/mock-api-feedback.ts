////////////////////////////////////////////////////////////////////////////////
// Mock Feedback Data Store — In-memory fake data for development
//////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { delay } from './mock-api';

export type FeedbackSource = 'floating_button' | 'milestone';
export type MilestoneType = 'first_project' | 'first_100_percent' | 'first_public_link';

export type Feedback = {
  id: string;
  userId: string;
  projectId: string | null;
  source: FeedbackSource;
  type: string | null;
  rating: number | null;
  message: string;
  createdAt: string;
};

export type FeedbackMutationPayload = {
  userId: string;
  projectId?: string;
  source: FeedbackSource;
  type?: MilestoneType;
  rating?: number;
  message: string;
};

export type FeedbackFilters = {
  userId?: string;
  source?: FeedbackSource;
  page?: number;
  limit?: number;
};

export const fakeFeedback = {
  records: [] as Feedback[],

  initialize() {
    // Generate some sample feedback
    for (let i = 1; i <= 5; i++) {
      this.records.push({
        id: `fb_${i}`,
        userId: 'user_demo',
        projectId: i <= 3 ? `proj_${i}` : null,
        source: faker.helpers.arrayElement(['floating_button', 'milestone']),
        type: faker.helpers.arrayElement([
          'first_project',
          'first_100_percent',
          'first_public_link',
          null
        ]),
        rating: faker.number.int({ min: 1, max: 5 }),
        message: faker.lorem.sentence(),
        createdAt: faker.date.recent().toISOString()
      });
    }
  },

  async getFeedback(filters: FeedbackFilters) {
    await delay(300);
    const { userId, source, page = 1, limit = 10 } = filters;

    let items = [...this.records];

    if (userId) {
      items = items.filter((f) => f.userId === userId);
    }
    if (source) {
      items = items.filter((f) => f.source === source);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const offset = (page - 1) * limit;
    const paginated = items.slice(offset, offset + limit);

    return {
      success: true,
      data: paginated,
      total,
      page,
      limit,
      message: 'Feedback fetched successfully'
    };
  },

  async createFeedback(data: FeedbackMutationPayload) {
    await delay(400);
    const newFeedback: Feedback = {
      id: `fb_${this.records.length + 1}`,
      userId: data.userId,
      projectId: data.projectId || null,
      source: data.source,
      type: data.type || null,
      rating: data.rating || null,
      message: data.message,
      createdAt: new Date().toISOString()
    };

    this.records.push(newFeedback);
    return newFeedback;
  }
};

fakeFeedback.initialize();
