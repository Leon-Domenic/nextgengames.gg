'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';
import ParticleField from '@/components/ParticleField';

export default function LeaderboardPage() {
  const [tier, setTier] = useState('all');

  const players = [
    { rank: 1, name: 'uThermal', rating: 2840, faction: 'Armada Vanguard', winRate: '78.4%', matches: 412, badge: 'Grand Pioneer' },
    { rank: 2, name: 'Vance_Prime', rating: 2795, faction: 'Armada Vanguard', winRate: '74.2%', matches: 388, badge: 'Grand Pioneer' },
    { rank: 3, name: 'Iron_Goliath', rating: 2750, faction: 'Cortex Syndicate', winRate: '71.9%', matches: 460, badge: 'Grand Pioneer' },
    { rank: 4, name: 'Phase_Ghost', rating: 2690, faction: 'Aetherion Void', winRate: '69.5%', matches: 340, badge: 'Fleet Marshal' },
    { rank: 5, name: 'Day9_Tactics', rating: 2640, faction: 'Armada Vanguard', winRate: '68.0%', matches: 295, badge: 'Fleet Marshal' },
    { rank: 6, name: 'Kodiak_Walker', rating: 2615, faction: 'Cortex Syndicate', winRate: '66.8%', matches: 510, badge: 'Fleet Marshal' },
    { rank: 7, name: 'Quantum_Blink', rating: 2580, faction: 'Aetherion Void', winRate: '65.2%', matches: 310, badge: 'Fleet Marshal' },
    { rank: 8, name: 'Titan_Commander', rating: 2540, faction: 'Armada Vanguard', winRate: '64.1%', matches: 280, badge: 'Fleet Marshal' },
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
            RANKED CIRCUIT // OPENSKILL RATINGS
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            GLOBAL ALPHA <span style={{ color: 'var(--armada-cyan)' }}>LEADERBOARD</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Real-time Elo and OpenSkill rating rankings across competitive 1v1, 4v4, and 8v8 planetary extraction lobbies.
          </p>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Leaderboard Table */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-full" style={{ maxWidth: '1080px' }}>
          <div className="hud-frame" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0f1420', borderBottom: '1px solid var(--border-medium)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 1.5rem' }}>RANK</th>
                    <th style={{ padding: '1rem 1.5rem' }}>PIONEER CALLSIGN</th>
                    <th style={{ padding: '1rem 1.5rem' }}>RATING</th>
                    <th style={{ padding: '1rem 1.5rem' }}>FACTION AFFINITY</th>
                    <th style={{ padding: '1rem 1.5rem' }}>WIN RATE</th>
                    <th style={{ padding: '1rem 1.5rem' }}>MATCHES</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr
                      key={p.rank}
                      style={{
                        borderBottom: '1px solid var(--border-dim)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s',
                      }}
                      className="table-row"
                    >
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800, color: p.rank <= 3 ? 'var(--cortex-orange)' : '#fff' }}>
                        #{p.rank}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span>{p.name}</span>
                        <span className="hud-badge hud-badge-cyan" style={{ fontSize: '0.65rem' }}>{p.badge}</span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800, color: 'var(--armada-cyan)' }}>
                        {p.rating}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-dim)' }}>
                        {p.faction}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--legion-acid)' }}>
                        {p.winRate}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>
                        {p.matches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .table-row:hover {
          background: rgba(0, 240, 255, 0.04);
        }
      `}</style>
    </div>
  );
}
