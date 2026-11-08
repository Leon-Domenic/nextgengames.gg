'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Gamepad2, Users, Play, Sparkles, ArrowRight, Dices, Shield, Cpu, Zap, Trophy, Flame
} from 'lucide-react';

export default function BrowserGamesHub() {
  const router = useRouter();
  const { user, playAsGuest } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const handleInstantSolo = async () => {
    try {
      setGuestLoading(true);
      if (!user) {
        await playAsGuest();
      }
      const randomRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/game/board-brawl/${randomRoom}?mode=blitz`);
    } catch (e) {
      alert(e.message);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleCreateParty = () => {
    router.push('/friends');
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    router.push(`/join/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          color: '#00f0ff',
          padding: '6px 16px',
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '16px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          <Gamepad2 size={16} />
          NextGen Arcade // Instant Web Play
        </div>
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
          fontWeight: 900,
          letterSpacing: '-1px',
          margin: '0 0 16px 0',
          background: 'linear-gradient(135deg, #ffffff 40%, #00f0ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          Browser Games
        </h1>
        <p style={{
          fontSize: '17px',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Play directly inside your browser with zero installation. Powered by real-time WebSockets,
          3D physics, and self-hosted low-latency servers.
        </p>
      </div>

      {/* Featured Game Hero Card: Board Brawl */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(20, 27, 45, 0.9) 0%, rgba(10, 14, 23, 0.95) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        borderRadius: '24px',
        padding: 'clamp(24px, 4vw, 44px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 240, 255, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '48px',
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                background: '#ff0055',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                FEATURED BROWSER TITLE
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#00ff88',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                <Flame size={14} /> LIVE MULTIPLAYER
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              margin: '0 0 14px 0',
              color: '#ffffff',
            }}>
              Board Brawl: Cyber Arena
            </h2>

            <p style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              A fast-paced, high-stakes 3D cyber board game. Roll physics-based dice, collect property nodes,
              unleash aggressive action cards (EMP Blast, Syphon, Heist), launch tomatoes at rival players,
              and claim monopoly dominance!
            </p>

            {/* Quick feature tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                🎲 3D Three.js Board & Dices
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                ⚡ Real-time WebSockets
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                🤖 Smart AI Bots
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                🃏 14+ Action Cards
              </span>
            </div>

            {/* Launch Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
              <button
                onClick={handleInstantSolo}
                disabled={guestLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                  color: '#060709',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Play size={18} fill="#060709" />
                {guestLoading ? 'Launching Game...' : 'Instant Play (Solo vs Bots)'}
              </button>

              <button
                onClick={handleCreateParty}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Users size={17} />
                Create Party Lobby
              </button>
            </div>

            {/* Quick Room Code Entry */}
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', maxWidth: '340px', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter 6-char Room Code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  background: '#00ff88',
                  color: '#060709',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Join
              </button>
            </form>
          </div>

          {/* Visual Showcase Card */}
          <div style={{
            background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.12), rgba(6, 9, 15, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, #00f0ff, #00ff88)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              boxShadow: '0 0 35px rgba(0, 240, 255, 0.4)',
            }}>
              🎲
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                Full 3D WebGL Engine
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Interactive board tilt, dynamic dice shadows, animated character pawns, card draw decks,
                and particle victory ceremonies.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#00f0ff' }}>2-4</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Players</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88' }}>10-15m</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fast Rounds</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffb703' }}>100%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Free to Play</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Other / Upcoming Browser Games */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>
          More Arcade Titles
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Card 1 */}
          <div style={{
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
            position: 'relative',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#fff' }}>Cyber Grid Tactics</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Turn-based grid strategy duel with customizable mechs and energy nodes.
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              IN DEVELOPMENT
            </span>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
            position: 'relative',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#fff' }}>Neon Speed Dices</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              High-velocity reflex dice matching game with global daily leaderboards.
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              IN DEVELOPMENT
            </span>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
            position: 'relative',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌌</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#fff' }}>Void Runner Mini</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Procedural infinite canvas obstacle avoider with synthwave audio track.
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              IN DEVELOPMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
