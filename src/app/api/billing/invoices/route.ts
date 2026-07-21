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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
  }

  if (!PADDLE_API_TOKEN) {
    return NextResponse.json({ success: true, data: [], message: 'Paddle API not configured' });
  }

  const [dbUser] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!dbUser?.email) {
    return NextResponse.json({ success: true, data: [], message: 'User not found' });
  }

  try {
    const res = await fetch(
      `${PADDLE_API_BASE}/transactions?email=${encodeURIComponent(dbUser.email)}&pageSize=20`,
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_TOKEN}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [], message: 'Failed to fetch invoices' });
    }

    const invoices = (data.data || []).map((tx: Record<string, unknown>) => ({
      id: tx.id,
      status: tx.status,
      createdAt: tx.created_at,
      currency: tx.currency_code,
      total: tx.total,
      invoiceNumber: tx.invoice_number
    }));

    return NextResponse.json({ success: true, data: invoices, message: 'OK' });
  } catch (error) {
    console.error('[Invoices] Error:', error);
    return NextResponse.json({ success: true, data: [], message: 'Failed to fetch invoices' });
  }
}
