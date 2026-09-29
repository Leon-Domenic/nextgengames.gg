'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';

export default function GuidesPage() {
  const [filter, setFilter] = useState('all');

  const guides = [
    {
      id: 'g1',
      category: 'beginner',
      title: 'Pioneer Field Manual: Your First 15 Minutes',
      level: 'Beginner',
      readTime: '6 min read',
      author: 'Fleet Command',
      desc: 'Step-by-step instructions for landing pod deployment, magnetic solar coupling, early mineral extractor setup, and Vassal drone automation.',
      tags: ['Deployment', 'Energy Wiring', 'Vassals'],
    },
    {
      id: 'g2',
      category: 'mechanics',
      title: 'Command Grid 2.0: Queuing, Routing & Macro Shifting',
      level: 'Intermediate',
      readTime: '10 min read',
      author: 'Senior Systems Designer',
      desc: 'Master shift-queuing construction chains, area-patrol perimeter sweeps, automated mineral convoy hauling, and synchronized orbital artillery strikes.',
      tags: ['Keybindings', 'Automation', 'Shortcuts'],
    },
    {
      id: 'g3',
      category: 'advanced',
      title: 'Subterranean Bunker Engineering & Blast Absorption',
      level: 'Advanced',
      readTime: '12 min read',
      author: 'Fortress Specialist',
      desc: 'How to excavate shock-absorbing zigzag voxel trenches that disperse tactical nuclear blast waves and protect critical battery banks.',
      tags: ['Voxel Terraforming', 'Defense', 'Physics'],
    },
    {
      id: 'g4',
      category: 'mechanics',
      title: 'Power Grids: Solar Efficiency vs Geothermal Vents',
      level: 'Intermediate',
      readTime: '8 min read',
      author: 'Chief Engineer',
      desc: 'Calculating day/night thermal curves, optimizing automated battery bank discharge priorities, and tapping high-risk volcanic geothermal geysers.',
      tags: ['Power', 'Logistics', 'Economy'],
    },
    {
      id: 'g5',
      category: 'beginner',
      title: 'Faction Selection Primer: Armada vs Cortex vs Aetherion',
      level: 'Beginner',
      readTime: '7 min read',
      author: 'Tactical Analyst',
      desc: 'A breakdown of playstyle differences, initial tech tree choices, weapon damage profiles, and counter-pick strategies for all 3 factions.',
      tags: ['Factions', 'Archetypes', 'Tech Tree'],
    },
    {
      id: 'g6',
      category: 'advanced',
      title: 'PvPvE Extraction Protocol: Void Gate Timing & Defense',
      level: 'Advanced',
      readTime: '14 min read',
      author: 'Top 50 Alpha Pioneer',
      desc: 'High-level competitive extraction meta: securing extraction beacons, defending against late-game dropship assaults, and safe crystal bank deposits.',
      tags: ['PvP', 'Extraction', 'Meta'],
    },
  ];

  const filtered = filter === 'all' ? guides : guides.filter((g) => g.category === filter);

  return (
    <div style={{ background: '#06070a', minHeight: '100vh', position: 'relative' }}>
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
            OPERATIONAL TRAINING // FIELD MANUALS
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            TACTICAL <span style={{ color: 'var(--armada-cyan)' }}>GUIDES &amp; CODEX</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Comprehensive documentation on real-time voxel terraforming, Command Grid 2.0 shortcuts, base automation networks, and competitive extraction strategy.
          </p>

          {/* Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'ALL MANUALS' },
              { id: 'beginner', label: 'BEGINNER' },
              { id: 'mechanics', label: 'SYSTEMS & CONTROLS' },
              { id: 'advanced', label: 'ADVANCED & META' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="btn-tech btn-tech-sm"
                style={{
                  background: filter === f.id ? 'var(--armada-cyan)' : 'rgba(16, 20, 29, 0.8)',
                  color: filter === f.id ? '#000' : 'var(--text-dim)',
                  borderColor: filter === f.id ? 'var(--armada-cyan)' : 'var(--border-dim)',
                  fontWeight: 800,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Guides Grid */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-full">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2rem',
            }}
          >
            {filtered.map((g) => (
              <article
                key={g.id}
                className="hud-frame"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '2rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span
                      className={`hud-badge ${
                        g.level === 'Beginner'
                          ? 'hud-badge-green'
                          : g.level === 'Intermediate'
                          ? 'hud-badge-cyan'
                          : 'hud-badge-red'
                      }`}
                    >
                      {g.level}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {g.readTime}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.85rem', lineHeight: 1.25 }}>
                    {g.title}
                  </h2>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {g.desc}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    {g.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '0.2rem 0.5rem',
                          color: 'var(--text-muted)',
                          borderRadius: '2px',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-dim)',
                    paddingTop: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Written by {g.author}
                  </span>
                  <Link href="/game#commands" className="btn-tech btn-tech-sm btn-tech-outline-cyan">
                    READ FIELD MANUAL →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
