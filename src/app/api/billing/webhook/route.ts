import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || '';

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('paddle-signature') || '';

  if (PADDLE_WEBHOOK_SECRET) {
    const isValid = await verifyWebhookSignature(body, signature, PADDLE_WEBHOOK_SECRET);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.event_type as string;
  const data = event.data as Record<string, unknown> | undefined;

  console.log('[Webhook] Received event:', eventType);

  if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
    const customData = data?.custom_data as Record<string, unknown> | undefined;
    const userId = customData?.userId as string | undefined;
    const status = data?.status as string | undefined;

    if (userId) {
      if (status === 'active' || status === 'trialing') {
        await db
          .update(user)
          .set({ plan: 'pro', updatedAt: new Date() })
          .where(eq(user.id, userId));
        console.log('[Webhook] Upgraded user to Pro:', userId);
      } else if (status === 'cancelled' || status === 'past_due') {
        await db
          .update(user)
          .set({ plan: 'free', updatedAt: new Date() })
          .where(eq(user.id, userId));
        console.log('[Webhook] Downgraded user to Free:', userId);
      }
    }
  }

  if (eventType === 'subscription.cancelled') {
    const customData = data?.custom_data as Record<string, unknown> | undefined;
    const userId = customData?.userId as string | undefined;

    if (userId) {
      await db.update(user).set({ plan: 'free', updatedAt: new Date() }).where(eq(user.id, userId));
      console.log('[Webhook] Downgraded user to Free (cancelled):', userId);
    }
  }

  return NextResponse.json({ success: true, message: 'OK' });
}
