'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sparkles, LogIn, Users } from 'lucide-react';

export default function JoinLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { code } = params;
  const { user, loading, playAsGuest } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/browsergames/board-brawl/${code}`);
    }
  }, [user, loading, code, router]);

  const handleInstantJoin = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await playAsGuest(guestName || null);
      router.replace(`/browsergames/board-brawl/${code}`);
    } catch (err) {
      alert(err.message || 'Failed to join');
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00f0ff', fontSize: '16px' }}>Entering Board Brawl lobby [{code}]...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(16, 20, 29, 0.95)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        boxShadow: '0 0 35px rgba(0, 240, 255, 0.2)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 16px auto',
          background: 'rgba(0, 240, 255, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}>
          🎮
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>
          JOIN PARTY MATCH
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0' }}>
          You were invited to Board Brawl room <span style={{ color: '#00f0ff', fontWeight: 700 }}>#{code}</span>!
        </p>

        <form onSubmit={handleInstantJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter your nickname (optional)"
            style={{
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              textAlign: 'center',
            }}
          />

          <button
            type="submit"
            disabled={submitting}
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
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={16} />
            {submitting ? 'Entering Lobby...' : 'Join as Instant Guest'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#94a3b8' }}>
            Have a registered account?
          </p>
          <a
            href={`/login?redirect=/join/${code}`}
            style={{
              color: '#00f0ff',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Sign in here →
          </a>
        </div>
      </div>
    </div>
  );
}
