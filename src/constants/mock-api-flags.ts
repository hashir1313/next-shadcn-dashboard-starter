////////////////////////////////////////////////////////////////////////////////
// Mock Feature Flags & Beta Flags Data Store — In-memory fake data
//////////////////////////////////////////////////////////////////////////////////

import { delay } from './mock-api';

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
};

export type FeatureFlagKey = 'file_uploads' | 'account_creation' | 'feedback_widget';

export type BetaFlag = {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
};

export const fakeFeatureFlags = {
  records: [
    {
      key: 'file_uploads',
      enabled: true,
      description: 'Allow users to upload files and images',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    },
    {
      key: 'account_creation',
      enabled: true,
      description: 'Allow new user sign-ups',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    },
    {
      key: 'feedback_widget',
      enabled: false,
      description: 'Show floating feedback button on dashboard',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    }
  ] as FeatureFlag[],

  async getAll() {
    await delay(200);
    return [...this.records];
  },

  async get(key: string) {
    await delay(100);
    return this.records.find((f) => f.key === key) || null;
  },

  async isEnabled(key: string) {
    const flag = this.records.find((f) => f.key === key);
    return flag?.enabled ?? false;
  },

  async set(key: string, enabled: boolean, updatedBy = 'admin') {
    await delay(300);
    const index = this.records.findIndex((f) => f.key === key);
    if (index !== -1) {
      this.records[index].enabled = enabled;
      this.records[index].updatedAt = new Date().toISOString();
      this.records[index].updatedBy = updatedBy;
      return this.records[index];
    }

    // Create new flag if it doesn't exist
    const newFlag: FeatureFlag = {
      key,
      enabled,
      description: '',
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    this.records.push(newFlag);
    return newFlag;
  }
};

export const fakeBetaFlags = {
  records: [
    {
      key: 'new_dashboard_layout',
      enabled: false,
      description: 'Experimental dashboard layout with sidebar on the right',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    },
    {
      key: 'ai_task_suggestions',
      enabled: false,
      description: 'AI-powered task title and description suggestions',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    }
  ] as BetaFlag[],

  async getAll() {
    await delay(200);
    return [...this.records];
  },

  async get(key: string) {
    await delay(100);
    return this.records.find((f) => f.key === key) || null;
  },

  async isEnabled(key: string) {
    const flag = this.records.find((f) => f.key === key);
    return flag?.enabled ?? false;
  },

  async set(key: string, enabled: boolean, updatedBy = 'admin') {
    await delay(300);
    const index = this.records.findIndex((f) => f.key === key);
    if (index !== -1) {
      this.records[index].enabled = enabled;
      this.records[index].updatedAt = new Date().toISOString();
      this.records[index].updatedBy = updatedBy;
      return this.records[index];
    }

    const newFlag: BetaFlag = {
      key,
      enabled,
      description: '',
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    this.records.push(newFlag);
    return newFlag;
  }
};
