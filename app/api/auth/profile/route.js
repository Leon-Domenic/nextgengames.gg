import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { avatar_color, avatar_token } = await request.json();
    const validTokens = ['hat', 'robot', 'car', 'yacht', 'rocket', 'duck', 'diamond', 'crown', 'brawler', 'mystic'];
    
    const newColor = avatar_color || user.avatar_color;
    const newToken = validTokens.includes(avatar_token) ? avatar_token : user.avatar_token;

    db.prepare('UPDATE users SET avatar_color = ?, avatar_token = ? WHERE id = ?').run(newColor, newToken, user.id);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        avatar_color: newColor,
        avatar_token: newToken
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
