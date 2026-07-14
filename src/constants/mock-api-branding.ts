////////////////////////////////////////////////////////////////////////////////
// Mock Branding Config Data Store — In-memory fake data for development
//////////////////////////////////////////////////////////////////////////////////

import { delay } from './mock-api';

export type BrandingConfig = {
  userId: string;
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: number;
  logoUrl: string | null;
  updatedAt: string;
};

export type BrandingMutationPayload = {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  logoUrl?: string;
};

export const fakeBranding = {
  records: [] as BrandingConfig[],

  initialize() {
    this.records = [
      {
        userId: 'user_demo',
        primaryColor: '#6366f1',
        backgroundColor: '#ffffff',
        fontFamily: 'inter',
        borderRadius: 8,
        logoUrl: null,
        updatedAt: new Date().toISOString()
      }
    ];
  },

  async getBranding(userId: string) {
    await delay(200);
    return this.records.find((b) => b.userId === userId) || null;
  },

  async upsertBranding(userId: string, data: BrandingMutationPayload) {
    await delay(400);
    const index = this.records.findIndex((b) => b.userId === userId);

    if (index !== -1) {
      this.records[index] = {
        ...this.records[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return this.records[index];
    }

    const newBranding: BrandingConfig = {
      userId,
      primaryColor: data.primaryColor || '#000000',
      backgroundColor: data.backgroundColor || '#ffffff',
      fontFamily: data.fontFamily || 'inter',
      borderRadius: data.borderRadius || 8,
      logoUrl: data.logoUrl || null,
      updatedAt: new Date().toISOString()
    };

    this.records.push(newBranding);
    return newBranding;
  }
};

fakeBranding.initialize();
