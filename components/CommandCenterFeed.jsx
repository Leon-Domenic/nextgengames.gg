'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CommandCenterFeed() {
  const [activeTab, setActiveTab] = useState('news');

  const newsItems = [
    {
      title: 'NextGenGames and Hooded Horse: Announcing Global Publishing Partnership',
      category: 'Announcements',
      date: 'September 24, 2026',
      excerpt:
        'We are thrilled to join forces with premier strategy publisher Hooded Horse to expand Project X to global audiences across Steam, Epic, and consoles.',
      img: '/screenshots/shot7.jpg',
      href: '/news',
    },
    {
      title: 'Dev Diary #15: Real-Time Subterranean Voxel Digging at 60 FPS',
      category: 'Engineering',
      date: 'September 12, 2026',
      excerpt:
        'A comprehensive architectural breakdown of our multithreaded compute shader terrain deformation pipeline running in Unreal Engine 5.',
      img: '/crafting-base.jpg',
      href: '/news',
    },
    {
      title: 'Founder Edition Pre-Orders Surpass 100,000 Verified Alpha Explorers',
      category: 'Community',
      date: 'August 28, 2026',
      excerpt:
        'Join the vanguard. Unlock exclusive Pioneer deep-space exosuits, permanent alpha leaderboard nameplates, and immediate playtest access.',
      img: '/merch/founder-pack.png',
      href: '/store',
    },
  ];

  const devlogs = [
    {
      version: 'v0.9.4a',
      title: 'Orbital Strike Trajectory Physics & Netcode Overhaul',
      date: 'September 22, 2026',
      summary:
        'Recalibrated ballistic arc calculations for long-range planetary artillery. Reduced client-server simulation desync by 42% on high-latency nodes.',
      tag: 'Balance & Netcode',
    },
    {
      version: 'v0.9.3c',
      title: 'Autonomous Vassal Drone Pathfinding on Sculpted Slopes',
      date: 'September 8, 2026',
      summary:
        'Vassal miner drones now dynamically generate navmesh voxel bridges across steep trenches and cratered topography without stalling.',
      tag: 'AI Behavior',
    },
    {
      version: 'v0.9.2',
      title: 'Conveyor Sorter Logic & Modular Battery Bank Nodes',
      date: 'August 20, 2026',
      summary:
        'Introduced 14 new smart routing modules for automated planetary refineries, including overflow gates and priority battery discharge.',
      tag: 'Automation',
    },
  ];

  const maps = [
    {
      name: 'Pyroclast Prime',
      type: 'Volcanic Caldera',
      players: '8 - 16 Players',
      size: '24km x 24km',
      hazard: 'Class-IV Thermal',
      img: '/screenshots/shot5.png',
      desc: 'Active magma flows carve natural choke points. Geothermal vents provide exponential energy at the risk of sudden eruption waves.',
    },
    {
      name: 'Valkyrie Ridge',
      type: 'Alpine Glacial Peaks',
      players: '4 - 8 Players',
      size: '16km x 16km',
      hazard: 'Class-II Blizzard',
      img: '/screenshots/shot7.jpg',
      desc: 'Dominant mountain high-ground grants unmatched radar vision and artillery range, but narrow passes funnel armor columns into ambush zones.',
    },
    {
      name: 'Sector 4 Abyss',
      type: 'Subterranean Crystal Rift',
      players: '2 - 6 Players',
      size: '12km x 12km',
      hazard: 'Class-V Void Rift',
      img: '/screenshots/shot1.png',
      desc: 'Deep subterranean darkness rich in dark crystal deposits. Voxel excavation is mandatory to tunnel toward contested extraction gates.',
    },
  ];

  const guides = [
    {
      title: 'Alpha Pioneer Primer: First 15 Minutes on a Hostile Planet',
      author: 'Senior Systems Designer',
      readTime: '6 min read',
      level: 'Beginner',
      href: '/guides',
      excerpt:
        'Master the initial drop: deployment beacon placement, solar battery coupling, basic Vassal drone assembly, and perimeter defense.',
    },
    {
      title: 'Command Grid 2.0: Advanced Macro Queues & Tactical Shift-Chaining',
      author: 'Competitive Balance Lead',
      readTime: '10 min read',
      level: 'Advanced',
      href: '/game#commands',
      excerpt:
        'Harness the full power of queue chaining, patrol grids, automated mineral hauling routes, and synchronized orbital artillery barrages.',
    },
    {
      title: 'Fortress Engineering: Subterranean Bunkers & Ballistic Deflection',
      author: 'Lead Level Architect',
      readTime: '8 min read',
      level: 'Intermediate',
      href: '/guides',
      excerpt:
        'Learn how to excavate layered voxel redoubts that absorb nuclear artillery shocks and funnel hostile mechanoid walkers into killboxes.',
    },
  ];

  return (
    <section
      style={{
        background: '#0a0d14',
        padding: '6rem 0',
        position: 'relative',
        zIndex: 5,
      }}
      id="intel"
    >
      <div className="container-full">
        {/* Section Heading & Interactive Tab Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '3.5rem',
          }}
        >
          <div className="section-subtitle">COMMAND CENTER FEED // LIVE INTEL</div>
          <h2 className="section-title">
            DISPATCH &amp; <span style={{ color: 'var(--armada-cyan)' }}>TACTICAL ARCHIVE</span>
          </h2>

          {/* BAR 4-Tab Switcher */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              background: 'rgba(16, 20, 29, 0.8)',
              padding: '0.4rem',
              clipPath: 'var(--chamfer-sm)',
              border: '1px solid var(--border-medium)',
              marginTop: '1.5rem',
            }}
          >
            {[
              { id: 'news', label: '📰 LATEST NEWS' },
              { id: 'devlog', label: '🛠️ DEVLOG & BALANCE' },
              { id: 'maps', label: '🗺️ PLANETARY MAPS' },
              { id: 'guides', label: '📖 GUIDES & CODEX' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn-tech btn-tech-sm"
                style={{
                  background: activeTab === tab.id ? 'var(--armada-cyan)' : 'transparent',
                  color: activeTab === tab.id ? '#000' : 'var(--text-dim)',
                  borderColor: activeTab === tab.id ? 'var(--armada-cyan)' : 'transparent',
                  fontWeight: 800,
                  boxShadow: activeTab === tab.id ? '0 0 15px var(--armada-glow)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: NEWS */}
        {activeTab === 'news' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {newsItems.map((item, i) => (
              <article key={i} className="hud-frame" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={item.img}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(6, 8, 12, 0.9)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--armada-cyan)',
                      padding: '0.25rem 0.6rem',
                      borderLeft: '2px solid var(--armada-cyan)',
                    }}
                  >
                    {item.category}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {item.date}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      lineHeight: 1.25,
                      marginBottom: '0.75rem',
                      color: '#fff',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.6,
                      marginBottom: '1.25rem',
                    }}
                  >
                    {item.excerpt}
                  </p>
                  <Link
                    href={item.href}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--armada-cyan)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    READ TRANSMISSION →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Tab 2: DEVLOG & BALANCE */}
        {activeTab === 'devlog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {devlogs.map((log, i) => (
              <div
                key={i}
                className="hud-frame"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  padding: '1.5rem 2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span
                    className="hud-badge hud-badge-red"
                    style={{ fontSize: '0.85rem', fontWeight: 800 }}
                  >
                    {log.version}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.25rem' }}>
                      {log.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', maxWidth: '750px' }}>
                      {log.summary}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {log.date}
                  </div>
                  <span className="hud-badge hud-badge-cyan">{log.tag}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: PLANETARY MAPS */}
        {activeTab === 'maps' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {maps.map((map, i) => (
              <div key={i} className="hud-frame" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: '210px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={map.img}
                    alt={map.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(6, 8, 12, 0.9)',
                      padding: '0.2rem 0.5rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--legion-acid)',
                    }}
                  >
                    {map.players} // {map.size}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--armada-cyan)' }}>
                      {map.type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cortex-red)' }}>
                      {map.hazard}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.65rem' }}>
                    {map.name}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {map.desc}
                  </p>
                  <Link href="/maps" className="btn-tech btn-tech-outline-cyan btn-tech-sm" style={{ width: '100%' }}>
                    VIEW SECTOR TELEMETRY →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: GUIDES & CODEX */}
        {activeTab === 'guides' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {guides.map((g, i) => (
              <div
                key={i}
                className="hud-frame"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '2rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <span className="hud-badge hud-badge-cyan">{g.level}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {g.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', lineHeight: 1.3, marginBottom: '0.75rem' }}>
                    {g.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {g.excerpt}
                  </p>
                </div>
                <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    By {g.author}
                  </span>
                  <Link href={g.href} style={{ color: 'var(--armada-cyan)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>
                    OPEN CODEX →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
