import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action } = await request.json();
    if (!requestId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const req = db.prepare('SELECT * FROM friendships WHERE id = ?').get(requestId);
    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (req.friend_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to respond to this request' }, { status: 403 });
    }

    if (action === 'accept') {
      db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(requestId);
      return NextResponse.json({ success: true, status: 'accepted' });
    } else {
      db.prepare('DELETE FROM friendships WHERE id = ?').run(requestId);
      return NextResponse.json({ success: true, status: 'declined' });
    }
  } catch (err) {
    console.error('Friend respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
