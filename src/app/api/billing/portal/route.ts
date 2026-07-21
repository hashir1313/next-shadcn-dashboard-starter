import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const PADDLE_API_TOKEN = process.env.PADDLE_API_TOKEN || '';
const PADDLE_ENV = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.startsWith('test_')
  ? 'sandbox'
  : 'production';

const PADDLE_API_BASE =
  PADDLE_ENV === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
  }

  if (!PADDLE_API_TOKEN) {
    return NextResponse.json(
      { success: false, message: 'Paddle API token not configured' },
      { status: 500 }
    );
  }

  const [dbUser] = await db
    .select({ paddleSubscriptionId: user.paddleSubscriptionId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!dbUser?.paddleSubscriptionId) {
    return NextResponse.json(
      { success: false, message: 'No active subscription found' },
      { status: 404 }
    );
  }

  try {
    const res = await fetch(
      `${PADDLE_API_BASE}/subscriptions/${dbUser.paddleSubscriptionId}/manage`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PADDLE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          return_url: `${request.headers.get('origin') || 'http://localhost:3000'}/dashboard/billing`
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('[Portal] Paddle API error:', data);
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Failed to create portal session' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: data.data.manage_url },
      message: 'OK'
    });
  } catch (error) {
    console.error('[Portal] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
