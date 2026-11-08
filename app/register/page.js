'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { UserPlus, Sparkles, AlertCircle, Check } from 'lucide-react';
import { CHARACTERS } from '@/lib/board-brawl/characters.js';

const COLORS = [
  { id: '#00f0ff', name: 'Neon Cyan' },
  { id: '#ff3344', name: 'Crimson' },
  { id: '#00ff88', name: 'Acid Green' },
  { id: '#a855f7', name: 'Electric Purple' },
  { id: '#f97316', name: 'Sunset Orange' },
  { id: '#eab308', name: 'Solar Gold' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, playAsGuest } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedToken, setSelectedToken] = useState('hat');
  const [selectedColor, setSelectedColor] = useState('#00f0ff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, selectedColor, selectedToken);
      router.push('/friends');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    try {
      await playAsGuest();
      router.push('/friends');
    } catch (err) {
      setError(err.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 30%, rgba(0, 240, 255, 0.08) 0%, transparent 60%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(16, 20, 29, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '36px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            margin: '0 0 6px 0',
            fontFamily: 'var(--font-display, sans-serif)',
            letterSpacing: '1px',
          }}>
            CREATE ACCOUNT
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Join nextgengames.gg to add friends, track stats & dominate Board Brawl
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 51, 68, 0.15)',
            border: '1px solid #ff3344',
            borderRadius: '8px',
            padding: '12px',
            color: '#ff6677',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. TycoonBoss"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 4 characters"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Character & Pawn Model Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
              Choose Character & Pawn Model (10 Unique Tycoons)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {CHARACTERS.map((c) => {
                const isSelected = selectedToken === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setSelectedToken(c.id);
                      setSelectedColor(c.color);
                    }}
                    title={`${c.name} - ${c.title}`}
                    style={{
                      padding: '8px 4px',
                      background: isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(0, 240, 255, 0.3)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{c.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? '#00f0ff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Character Preview Badge */}
            {(() => {
              const activeChar = CHARACTERS.find(c => c.id === selectedToken) || CHARACTERS[0];
              return (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: `1px solid ${activeChar.color}44`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: `${activeChar.color}22`,
                    border: `2px solid ${activeChar.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}>
                    {activeChar.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                      {activeChar.name} <span style={{ fontSize: '11px', color: activeChar.color }}>({activeChar.title})</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {activeChar.description}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Color Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
              Choose Your Neon Glow
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  title={c.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c.id,
                    border: selectedColor === c.id ? '3px solid #fff' : 'none',
                    boxShadow: selectedColor === c.id ? `0 0 12px ${c.id}` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedColor === c.id && <Check size={16} color="#000" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '13px',
              background: '#00f0ff',
              color: '#060709',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '6px',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
            }}
          >
            <UserPlus size={16} />
            {loading ? 'Creating Account...' : 'Complete Sign Up'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '22px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        <button
          onClick={handleGuest}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f0f4f8',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={16} color="#00f0ff" />
          Continue as Instant Guest
        </button>

        <p style={{ textAlign: 'center', marginTop: '22px', marginBottom: 0, fontSize: '13px', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
