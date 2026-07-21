import type { PlanDetails } from './types';

export const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Core features for getting started',
    price: '$0',
    interval: 'forever',
    projectLimit: 3,
    features: [
      'Up to 3 projects',
      'Basic task management',
      'Public progress pages',
      '10 dashboard themes'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals who need more',
    price: '$5',
    interval: '/month',
    projectLimit: null,
    features: [
      'Unlimited projects',
      'Branded public pages',
      'Custom themes & logo',
      'Priority support'
    ]
  }
];

export const FREE_PROJECT_LIMIT = 3;

export const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
export const PADDLE_PRO_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || '';
