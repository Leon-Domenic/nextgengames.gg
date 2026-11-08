'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { Users, LogIn, LogOut, UserPlus, Sparkles, Trophy, Sun, Moon } from 'lucide-react';
import { TOKEN_ICONS } from '@/lib/board-brawl/characters.js';

export default function Navbar() {
  const { user, logout, playAsGuest, onlineUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleQuickGuest = async () => {
    try {
      setGuestLoading(true);
      await playAsGuest();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  const onlineFriendsCount = onlineUsers.filter(u => u.userId !== user?.id).length;

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      background: 'rgba(10, 13, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #00f0ff, #0ea5e9)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
          }}>
            🎲
          </div>
          <span style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '1px',
            color: '#ffffff',
            textTransform: 'uppercase',
          }}>
            NextGen<span style={{ color: '#00f0ff' }}>Games</span>
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>.gg</span>
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{
            color: '#f0f4f8',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'color 0.2s',
          }}>
            Games
          </Link>

          <Link href="/friends" style={{
            color: '#f0f4f8',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            position: 'relative',
          }}>
            <Users size={16} color="#00f0ff" />
            Friends & Parties
            {onlineFriendsCount > 0 && (
              <span style={{
                background: '#00ff88',
                color: '#060709',
                fontSize: '11px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '2px',
              }}>
                {onlineFriendsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Right Side / Auth Status & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Light / Dark Mode Toggle Switch */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 12px',
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
            borderRadius: '20px',
            color: theme === 'dark' ? '#fbbf24' : '#0f172a',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#0f172a" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* User Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${user.avatar_color || '#00f0ff'}44`,
              borderRadius: '24px',
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: `${user.avatar_color || '#00f0ff'}22`,
                border: `2px solid ${user.avatar_color || '#00f0ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>
                {TOKEN_ICONS[user.avatar_token] || '🎩'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  {user.username}
                  {user.is_guest && <span style={{ fontSize: '10px', color: '#f97316', marginLeft: '4px' }}>(Guest)</span>}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  🏆 {user.stats?.wins || 0} Wins
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(255, 51, 68, 0.12)',
                color: '#ff3344',
                border: '1px solid rgba(255, 51, 68, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleQuickGuest}
              disabled={guestLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(0, 240, 255, 0.1)',
                color: '#00f0ff',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} />
              {guestLoading ? 'Connecting...' : 'Play as Guest'}
            </button>

            <Link
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f0f4f8',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <LogIn size={14} />
              Login
            </Link>

            <Link
              href="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#00f0ff',
                color: '#060709',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <UserPlus size={14} />
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
