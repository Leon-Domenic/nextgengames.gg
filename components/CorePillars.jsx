'use client';

import Link from 'next/link';
import CrumbleDivider from './CrumbleDivider';

export default function CorePillars() {
  const blocks = [
    {
      id: 'gunplay',
      align: 'right',
      subtitle: 'CS2-GRADE TACTICAL FIDELITY',
      titlePrimary: 'PHOTOREALISTIC COMBAT &',
      titleSecondary: 'WAR DOGS MILITARY GRIT',
      description:
        'Engineered for extreme competitive precision. Experience sub-tick level input responsiveness, mastery-driven physical recoil patterns, localized ballistic hitboxes, and dynamic volumetric smoke that physically interacts with gunfire and doorways.',
      actions: [
        { text: 'GUNPLAY CODEX', href: '/guides', variant: 'primary' },
        { text: 'WEAPON ARSENAL', href: '/game#weapons', variant: 'outline' },
      ],
      img: '/screenshots/shot2.png',
      alt: 'Tactical Military Combat and High-Intensity Gunplay',
      hudTag: 'BALLISTICS // SUB-TICK 60Hz PRECISION',
      statLabel: 'INPUT LATENCY',
      statValue: 'SUB-1MS BUFFER',
    },
    {
      id: 'basebuilding',
      align: 'left',
      subtitle: 'COOPERATIVE PVE SANCTUARY',
      titlePrimary: 'PERSISTENT BASEBUILDING &',
      titleSecondary: 'SQUAD COSMETICS',
      description:
        'Your Sanctum is an un-raidable private homeworld shared with your friends. Snap together fortified compound walls, modular workshops, weapon display racks, and cozy squad lounges. Decorate with trophy mounts from defeated dimensional bosses and custom cosmetic camos.',
      actions: [{ text: 'BASE ARCHITECTURE GUIDE', href: '/guides', variant: 'primary' }],
      img: '/crafting-base.jpg',
      alt: 'Modular Co-op Sanctum Base and Workshop',
      hudTag: 'SANCTUM PROTOCOL // SAFE HAVEN STATUS',
      statLabel: 'MODULAR COMPONENTS',
      statValue: '150+ SNAP-FIT TILES',
    },
    {
      id: 'rifts',
      align: 'right',
      subtitle: 'SPACETIME DETECTION ARRAY',
      titlePrimary: 'SEARCH THE STARS FOR',
      titleSecondary: 'RARE VOLATILE RIFTS',
      description:
        'Erect telemetry radar dishes atop your compound to monitor deep-space frequencies. Standard rifts offer stable resource extraction, while rare, highly volatile tear lines trigger server-wide alerts, offering mythical prototype gear and legendary boss bounties.',
      actions: [{ text: 'STAR CHARTS & MAPS', href: '/maps', variant: 'primary' }],
      img: '/screenshots/shot7.jpg',
      alt: 'Planetary Radar Telemetry and Dimensional Rift Tracking',
      hudTag: 'FREQUENCY SCAN // ANOMALY DETECTED',
      statLabel: 'RIFT STABILITY CLASSES',
      statValue: 'TIER I - V VOLATILITY',
    },
    {
      id: 'incursions',
      align: 'left',
      subtitle: 'ARC RAIDERS-INSPIRED PVE & PVPVE // 4 DIFFICULTY TIERS',
      titlePrimary: 'THE KUÍ-LĚI THREAT &',
      titleSecondary: 'DYNAMIC RIFT DIFFICULTY MATRIX',
      description:
        'Face off against the Kuí-Lěi (傀儡)—eerie Chinese-engineered humanoid combat automatons patrolling contested rift wastelands. Feature ARC Raiders-style acoustic stealth, 3-second siren alerts that trigger orbital drop-pod reinforcements, and localized weak-point dismemberment. Venture into 4 scaled difficulty tiers—from Green Recon incursions to high-stakes Mythic Void Singularities with escalating loot rarity and tighter countdown clocks.',
      actions: [
        { text: 'RIFT DIFFICULTY TIERS', href: '/game', variant: 'primary' },
        { text: 'PLAYTEST ON STEAM', href: '#download', variant: 'outline' },
      ],
      img: '/screenshots/humanoid_threats.jpg',
      alt: 'Kuí-Lěi Chinese Humanoid Combat Automatons in Rift Sector',
      hudTag: 'THREAT CLASS: KUÍ-LĚI G-SERIES // 4 DIFFICULTY TIERS',
      statLabel: 'REINFORCEMENT SPEED',
      statValue: '3.0s SIREN DROP-PODS',
    },
  ];

  return (
    <section
      style={{
        background: '#0a0d12',
        position: 'relative',
        paddingTop: '6rem',
        paddingBottom: '6rem',
      }}
      id="pillars"
    >
      <div className="container-full">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div className="section-subtitle">PROJECT RIFTFALL // CORE PILLARS</div>
          <h2 className="section-title">
            TACTICAL EXTRACTION <span style={{ color: 'var(--armada-cyan)' }}>REDEFINED</span>
          </h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>
            Photorealistic CS2-grade weapon handling meets persistent cooperative base engineering and high-stakes dimensional rift warfare.
          </p>
        </div>

        {/* Alternating Feature Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6.5rem' }}>
          {blocks.map((block, index) => {
            const isReverse = block.align === 'left';

            return (
              <div
                key={block.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '3.5rem',
                  alignItems: 'center',
                }}
              >
                {/* Media Column */}
                <div
                  style={{
                    order: isReverse ? 2 : 1,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      clipPath: 'var(--chamfer-md)',
                      overflow: 'hidden',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                    }}
                  >
                    <img
                      src={block.img}
                      alt={block.alt}
                      style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '16/10',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.6s var(--ease-out-expo)',
                      }}
                      className="pillar-img"
                    />

                    {/* HUD Corner Accents */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.15em',
                        color: 'var(--armada-cyan)',
                        background: 'rgba(6, 8, 12, 0.85)',
                        padding: '0.3rem 0.6rem',
                        borderLeft: '2px solid var(--armada-cyan)',
                      }}
                    >
                      {block.hudTag}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.12em',
                        color: '#fff',
                        background: 'rgba(6, 8, 12, 0.85)',
                        padding: '0.3rem 0.6rem',
                        borderRight: '2px solid var(--cortex-red)',
                      }}
                    >
                      {block.statLabel}: <strong style={{ color: 'var(--armada-cyan)' }}>{block.statValue}</strong>
                    </div>
                  </div>
                </div>

                {/* Content Column */}
                <div
                  style={{
                    order: isReverse ? 1 : 2,
                    maxWidth: '580px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      letterSpacing: '0.18em',
                      color: index % 2 === 0 ? 'var(--armada-cyan)' : 'var(--cortex-red)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    // 0{index + 1} — {block.subtitle}
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      marginBottom: '1.25rem',
                    }}
                  >
                    {block.titlePrimary}{' '}
                    <span
                      style={{
                        color: index % 2 === 0 ? 'var(--armada-cyan)' : 'var(--cortex-red)',
                      }}
                    >
                      {block.titleSecondary}
                    </span>
                  </h3>

                  <p
                    style={{
                      fontSize: '1.05rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.7,
                      marginBottom: '2rem',
                    }}
                  >
                    {block.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                    {block.actions.map((act, i) => (
                      <Link
                        key={i}
                        href={act.href}
                        className={`btn-tech btn-tech-sm ${
                          act.variant === 'primary'
                            ? index % 2 === 0
                              ? 'btn-tech-primary'
                              : 'btn-tech-red'
                            : 'btn-tech-outline-cyan'
                        }`}
                      >
                        {act.text}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .pillar-img:hover {
          transform: scale(1.03);
        }
      `}</style>

      {/* Bottom Crumble Divider */}
      <div style={{ marginTop: '5rem' }}>
        <CrumbleDivider position="bottom" fill="#060709" bg="transparent" />
      </div>
    </section>
  );
}
