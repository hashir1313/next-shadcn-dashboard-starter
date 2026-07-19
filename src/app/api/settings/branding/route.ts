import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { fakeBranding } from '@/constants/mock-api-branding';

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await fakeBranding.getBranding(userId);
  return NextResponse.json({ success: true, data, message: 'OK' });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = await fakeBranding.upsertBranding(userId, body);
  return NextResponse.json({ success: true, data, message: 'Branding updated' });
}
