import { NextResponse } from 'next/server';
import { getUserId, getSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image
    },
    message: 'OK'
  });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, username } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
  }

  // Check username uniqueness if provided
  if (username && typeof username === 'string') {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, cleanUsername))
      .limit(1);

    if (existing && existing.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 400 }
      );
    }

    await db
      .update(user)
      .set({ name: name.trim(), username: cleanUsername, updatedAt: new Date() })
      .where(eq(user.id, userId));
  } else {
    await db
      .update(user)
      .set({ name: name.trim(), updatedAt: new Date() })
      .where(eq(user.id, userId));
  }

  return NextResponse.json({ success: true, message: 'Account updated' });
}

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Soft-delete: mark status as deleted
  await db
    .update(user)
    .set({ status: 'deleted', updatedAt: new Date() })
    .where(eq(user.id, userId));

  return NextResponse.json({ success: true, message: 'Account deleted' });
}
