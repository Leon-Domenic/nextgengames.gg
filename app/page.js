'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Gamepad2, Users, Play, Sparkles, ArrowRight, ShieldCheck, Flame, Trophy, Dices
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, playAsGuest } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const handleCreateLobby = () => {
    router.push('/browsergames');
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    router.push(`/join/${joinCode.trim().toUpperCase()}`);
  };

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

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px 20px',
        position: 'relative',
      }}>
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
          marginBottom: '20px',
        }}>
          <Sparkles size={16} />
          MULTIPLAYER BROWSER GAMING PLATFORM
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 900,
          margin: '0 0 16px 0',
          letterSpacing: '-1px',
          lineHeight: 1.1,
          fontFamily: 'var(--font-display, sans-serif)',
          textTransform: 'uppercase',
        }}>
          Play Real-Time Games <br />
          <span style={{
            background: 'linear-gradient(135deg, #00f0ff, #0ea5e9, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Together In Browser
          </span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#94a3b8',
          maxWidth: '680px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6,
        }}>
          Jump into high-stakes browser matches with your friends, invite squads in 1 click,
          and unleash chaotic tomato sabotage in our headline board game, <strong>Board Brawl</strong>.
        </p>

        {/* Quick Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <button
            onClick={handleCreateLobby}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 32px',
              background: '#00f0ff',
              color: '#060709',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 35px rgba(0, 240, 255, 0.4)',
            }}
          >
            <Users size={20} />
            BROWSER GAMES & PARTY LOBBY
          </button>

          <button
            onClick={handleInstantSolo}
            disabled={guestLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 28px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Play size={18} fill="#fff" />
            {guestLoading ? 'Starting...' : 'Instant Solo Match vs Bots'}
          </button>
        </div>

        {/* 1-Click Room Join Form */}
        <form
          onSubmit={handleJoinByCode}
          style={{
            maxWidth: '400px',
            margin: '0 auto',
            display: 'flex',
            gap: '8px',
            background: 'rgba(16, 20, 29, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '6px',
          }}
        >
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter Room Code (e.g. BRAWL1)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              textAlign: 'center',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              borderRadius: '8px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Join
          </button>
        </form>
      </div>

      {/* Featured Game: BOARD BRAWL Showcase */}
      <div style={{
        marginTop: '60px',
        background: 'linear-gradient(135deg, rgba(16, 20, 29, 0.95) 0%, rgba(10, 13, 18, 0.98) 100%)',
        border: '2px solid rgba(0, 240, 255, 0.3)',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.15)',
        borderRadius: '24px',
        padding: '48px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '40px',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 51, 68, 0.15)',
            border: '1px solid #ff3344',
            color: '#ff6677',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 800,
            marginBottom: '16px',
          }}>
            <Flame size={14} />
            HEADLINE FEATURED GAME
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 16px 0', color: '#fff' }}>
            BOARD BRAWL
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.7, margin: '0 0 24px 0' }}>
            A fast-paced 6-player board game inspired by <em>Business Tour</em> and classic Monopoly.
            Trade 32 Global Landmarks, pull off dramatic <strong>2x Buyouts</strong>, upgrade to permanent
            buyout-proof <strong>Landmarks</strong>, and hurl juicy tomatoes directly into rival screens to trigger
            <strong> real-time screen shake and vision-blocking splatters</strong>!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#f0f4f8' }}>
              <span style={{ fontSize: '18px' }}>🎲</span>
              <span>3D Tumbling Physics Dice</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#f0f4f8' }}>
              <span style={{ fontSize: '18px' }}>🍅</span>
              <span>Screen Shake & Wipeable Splat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#f0f4f8' }}>
              <span style={{ fontSize: '18px' }}>👑</span>
              <span>Line & Triple Monopolies</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#f0f4f8' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <span>Up to 6 Seats & Smart AI Bots</span>
            </div>
          </div>

          <button
            onClick={handleInstantSolo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 28px',
              background: '#00f0ff',
              color: '#060709',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
            }}
          >
            PLAY BOARD BRAWL NOW
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Graphic Mockup / Board Teaser */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '72px', margin: '20px 0' }}>
            🌍 🍅 🎲
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Tokyo • Paris • New York • Dubai
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            32 Global Cities • 8 Color Sets • Blitz (20m) & Normal Modes
          </p>
        </div>
      </div>

      {/* Multi-Game Catalog / Coming Soon Shelf */}
      <div style={{ marginTop: '80px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
            NEXTGENGAMES CATALOG
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            More browser-based multiplayer games coming to your squad&apos;s rotation
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Card 1: Board Brawl */}
          <div style={{
            background: 'rgba(16, 20, 29, 0.8)',
            border: '1px solid #00f0ff',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#00ff88',
              color: '#060709',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              PLAYABLE NOW
            </span>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎲</div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              Board Brawl
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              6-Player Monopoly & Business Tour board game with tomato screen shake.
            </p>
            <button
              onClick={handleCreateLobby}
              style={{
                width: '100%',
                padding: '10px',
                background: '#00f0ff',
                color: '#060709',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Play Match →
            </button>
          </div>

          {/* Card 2: Cyber Tank Arena */}
          <div style={{
            background: 'rgba(16, 20, 29, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
          }}>
            <span style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '8px',
            }}>
              COMING SOON
            </span>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💥</div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              Cyber Tanks
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Top-down 2D neon tank deathmatch in destructible procedural labyrinths.
            </p>
          </div>

          {/* Card 3: Galactic Fleet */}
          <div style={{
            background: 'rgba(16, 20, 29, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
          }}>
            <span style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '8px',
            }}>
              COMING SOON
            </span>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚀</div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              Galactic Fleet
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Turn-based naval radar warfare on planetary coordinate grids.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
