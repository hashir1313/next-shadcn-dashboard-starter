export type Plan = 'free' | 'pro';

export type PlanDetails = {
  id: Plan;
  name: string;
  description: string;
  price: string;
  interval: string;
  features: string[];
  projectLimit: number | null;
};

export type UserPlanInfo = {
  plan: Plan;
  paddleSubscriptionId: string | null;
  paddleCustomerId: string | null;
};

export type CheckoutPayload = {
  planId: string;
  email: string;
  userId: string;
};
