'use client';

import Link from 'next/link';

export default function CommunityHub() {
  return (
    <section
      style={{
        background: '#06070a',
        padding: '6rem 0',
        position: 'relative',
        zIndex: 5,
      }}
      id="community"
    >
      <div className="container-full">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-subtitle">PIONEER ECOSYSTEM // COMMUNITY</div>
          <h2 className="section-title">
            JOIN THE <span style={{ color: 'var(--armada-cyan)' }}>NEXTGEN COMMUNITY</span>
          </h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>
            Coordinate 16-player planetary expedition fleets, organize competitive tournaments, and shape game balance directly with the core developers.
          </p>
        </div>

        {/* Community Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* Card 1: Official Discord Hub */}
          <div
            className="hud-frame"
            style={{
              background: 'linear-gradient(145deg, rgba(88, 101, 242, 0.1) 0%, rgba(16, 20, 29, 0.7) 100%)',
              borderColor: 'rgba(88, 101, 242, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span className="hud-badge" style={{ color: '#5865F2', borderColor: '#5865F2', background: 'rgba(88, 101, 242, 0.15)' }}>
                  ★ OFFICIAL DISCORD
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--legion-acid)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="radar-ping" style={{ width: '6px', height: '6px' }} />
                  52,400 PIONEERS ONLINE
                </span>
              </div>
              <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.75rem' }}>
                Mission Control Voice &amp; LFG
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Find tactical wingmen for high-risk extraction runs, discuss balance proposals in our dev channels, and participate in weekly community playtests with the dev team.
              </p>
            </div>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="btn-tech btn-tech-primary btn-tech-sm"
              style={{
                background: '#5865F2',
                borderColor: '#7289da',
                color: '#fff',
                boxShadow: '0 0 20px rgba(88, 101, 242, 0.5)',
              }}
            >
              <img src="/icons/icon-discord.svg" alt="Discord" width="16" height="16" />
              JOIN NEXTGEN DISCORD
            </a>
          </div>

          {/* Card 2: Competitive Circuit & Tournaments */}
          <div
            className="hud-frame"
            style={{
              background: 'linear-gradient(145deg, rgba(255, 51, 68, 0.1) 0%, rgba(16, 20, 29, 0.7) 100%)',
              borderColor: 'rgba(255, 51, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span className="hud-badge hud-badge-red">
                  🏆 COMPETITIVE LEAGUE
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cortex-orange)' }}>
                  $25,000 PRIZE POOL
                </span>
              </div>
              <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.75rem' }}>
                Sector 4 Championship Series
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Compete against the galaxy&apos;s sharpest tacticians in standardized 4v4 and 8v8 competitive lobbies. Live spectator telemetry, auto-replays, and caster overlays.
              </p>
            </div>
            <Link href="/game#tournaments" className="btn-tech btn-tech-red btn-tech-sm">
              VIEW TOURNAMENT BRACKETS
            </Link>
          </div>

          {/* Card 3: Creator Program & Modding */}
          <div
            className="hud-frame"
            style={{
              background: 'linear-gradient(145deg, rgba(0, 240, 255, 0.1) 0%, rgba(16, 20, 29, 0.7) 100%)',
              borderColor: 'rgba(0, 240, 255, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span className="hud-badge hud-badge-cyan">
                  ⚡ CREATOR VAULT
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--armada-cyan)' }}>
                  PARTNER PROGRAM
                </span>
              </div>
              <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.75rem' }}>
                Streamers &amp; Custom Map Editors
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Apply for official partner access, beta key drops for your stream viewers, and early tools to build custom planetary biomes using our in-engine voxel terrain SDK.
              </p>
            </div>
            <Link href="/game#creators" className="btn-tech btn-tech-outline-cyan btn-tech-sm">
              APPLY FOR CREATOR PROGRAM
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
