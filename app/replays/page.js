'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';
import ParticleField from '@/components/ParticleField';

export default function ReplaysPage() {
  const replays = [
    {
      id: 'rep-9421',
      title: 'Sector 4 Grand Finals: Armada Titan Rush vs Cortex Swarm Walkers',
      map: 'Pyroclast Prime',
      duration: '42m 18s',
      patch: 'v0.9.4',
      date: 'September 28, 2026',
      players: '8v8 Ranked Fleet',
      winner: 'ARMADA VANGUARD',
      mvp: 'Commander_Vance (K/D 4.2)',
    },
    {
      id: 'rep-9418',
      title: 'Valkyrie Ridge High-Ground King of the Hill: Subterranean Flank',
      map: 'Valkyrie Ridge',
      duration: '28m 45s',
      patch: 'v0.9.4',
      date: 'September 27, 2026',
      players: '4v4 Tactical',
      winner: 'AETHERION VOIDFARERS',
      mvp: 'Phase_Ghost (K/D 5.8)',
    },
    {
      id: 'rep-9390',
      title: 'Cobalt Expanse Naval Warfare: Amphibious Juggernaut Incursion',
      map: 'Cobalt Expanse',
      duration: '51m 10s',
      patch: 'v0.9.3c',
      date: 'September 25, 2026',
      players: '8v8 Ranked Fleet',
      winner: 'CORTEX SYNDICATE',
      mvp: 'Iron_Goliath (K/D 3.9)',
    },
    {
      id: 'rep-9382',
      title: 'Sector 4 Abyss 1v1 Invitational: Void Gate Crystal Rush',
      map: 'Sector 4 Abyss',
      duration: '16m 04s',
      patch: 'v0.9.3c',
      date: 'September 23, 2026',
      players: '1v1 Pro Duel',
      winner: 'ARMADA VANGUARD',
      mvp: 'uThermal (K/D 8.0)',
    },
  ];

  return (
    <div style={{ background: '#06070a', minHeight: '100vh', position: 'relative' }}>
      <ParticleField count={40} color="cyan" />

      {/* Header */}
      <section
        style={{
          position: 'relative',
          padding: '8rem 0 4rem 0',
          background: 'linear-gradient(180deg, #040508 0%, #0a0d14 100%)',
          textAlign: 'center',
        }}
      >
        <div className="container-full">
          <div className="section-subtitle" style={{ justifyContent: 'center' }}>
            TELEMETRY VAULT // REPLAY PARSER
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            MATCH <span style={{ color: 'var(--armada-cyan)' }}>REPLAYS &amp; TELEMETRY</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Download tick-perfect match recordings. Analyze unit build orders, macro resource efficiency, and voxel terrain excavations in 3D spectator view.
          </p>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Replays List */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-full" style={{ maxWidth: '1080px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {replays.map((rep) => (
              <div
                key={rep.id}
                className="hud-frame"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  padding: '2rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <span className="hud-badge hud-badge-cyan">{rep.patch}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rep.date} • {rep.players} • {rep.duration}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
                    {rep.title}
                  </h2>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    MAP: <span style={{ color: '#fff' }}>{rep.map}</span> • VICTOR: <span style={{ color: 'var(--legion-acid)' }}>{rep.winner}</span> • MVP: <span style={{ color: 'var(--cortex-orange)' }}>{rep.mvp}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => alert(`Downloading telemetry replay file for ${rep.id}...`)}
                    className="btn-tech btn-tech-primary btn-tech-sm"
                  >
                    DOWNLOAD REPLAY (.BARP)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
