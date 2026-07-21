import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/features/billing/api/service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
  }

  const planInfo = await getUserPlan(userId);
  return NextResponse.json({ success: true, data: planInfo, message: 'OK' });
}
