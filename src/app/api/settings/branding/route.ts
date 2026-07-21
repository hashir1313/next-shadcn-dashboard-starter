import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { brandingConfigs, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const [data] = await db
    .select()
    .from(brandingConfigs)
    .where(eq(brandingConfigs.userId, userId))
    .limit(1);

  return NextResponse.json({ success: true, data: data || null, message: 'OK' });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Server-side plan check: only Pro users can update branding
  const [dbUser] = await db
    .select({ plan: user.plan })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (dbUser?.plan !== 'pro') {
    return NextResponse.json(
      {
        success: false,
        message: 'Branding is a Pro feature. Upgrade to Pro to customize your public pages.'
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const [existing] = await db
    .select()
    .from(brandingConfigs)
    .where(eq(brandingConfigs.userId, userId))
    .limit(1);

  let result;

  if (existing) {
    [result] = await db
      .update(brandingConfigs)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(brandingConfigs.userId, userId))
      .returning();
  } else {
    [result] = await db
      .insert(brandingConfigs)
      .values({
        userId,
        primaryColor: body.primaryColor || '#000000',
        backgroundColor: body.backgroundColor || '#ffffff',
        fontFamily: body.fontFamily || 'inter',
        borderRadius: body.borderRadius || 8,
        logoUrl: body.logoUrl || null
      })
      .returning();
  }

  return NextResponse.json({ success: true, data: result, message: 'Branding updated' });
}
