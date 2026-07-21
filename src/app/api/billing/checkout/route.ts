import { NextRequest, NextResponse } from 'next/server';
import { updateUserPlan } from '@/features/billing/api/service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, plan } = body;

  if (!userId || !plan) {
    return NextResponse.json(
      { success: false, message: 'userId and plan required' },
      { status: 400 }
    );
  }

  if (plan !== 'free' && plan !== 'pro') {
    return NextResponse.json(
      { success: false, message: 'Invalid plan. Must be "free" or "pro".' },
      { status: 400 }
    );
  }

  await updateUserPlan(userId, plan);
  return NextResponse.json({ success: true, message: 'Plan updated' });
}
