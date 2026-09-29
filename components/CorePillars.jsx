'use client';

import Link from 'next/link';
import CrumbleDivider from './CrumbleDivider';

export default function CorePillars() {
  const blocks = [
    {
      id: 'scale',
      align: 'right', // text right, image left or vice versa
      subtitle: 'UNMATCHED SCALE & FIDELITY',
      titlePrimary: 'REAL-TIME VOXEL',
      titleSecondary: 'BALLISTICS & SIMULATION',
      description:
        'Every projectile, laser trace, and cratering detonation is physically calculated in real-time. Blast through subterranean caverns, collapse enemy fortress foundations, and sculpt trenches across thousands of kilometers of procedural planetary landscape.',
      actions: [
        { text: 'SCREENSHOTS VAULT', href: '/game#screenshots', variant: 'outline' },
        { text: 'GAMEPLAY MECHANICS', href: '/game', variant: 'primary' },
      ],
      img: '/screenshots/shot2.png',
      alt: 'Massive Modular Base Combat and Extraction',
      hudTag: 'SECTOR-04 // LAT: 42.81°N LON: 114.2°W',
      statLabel: 'DEFORMATION RESOLUTION',
      statValue: '0.1M TRUE VOXEL',
    },
    {
      id: 'terrain',
      align: 'left',
      subtitle: 'GEOGRAPHIC SUPREMACY',
      titlePrimary: 'STRATEGIC IMPORTANCE',
      titleSecondary: 'OF PLANETARY TERRAIN',
      description:
        'The geological contours of each world dictate which strategies triumph. Radar telemetry cannot pierce volcanic mountain peaks, geothermal rifts provide limitless reactor power, and orbital artillery physically levels ridges to deny hostile line-of-sight.',
      actions: [{ text: 'LEARN HOW TO PLAY', href: '/guides', variant: 'primary' }],
      img: '/screenshots/shot7.jpg',
      alt: 'Planetary Rift Survey and High-Ground Base Outpost',
      hudTag: 'ATMOSPHERIC HAZARD // CLASS-V RADIATION',
      statLabel: 'TERRAIN TYPES',
      statValue: '12 PROCEDURAL BIOMES',
    },
    {
      id: 'controls',
      align: 'right',
      subtitle: 'EFFORTLESS AUTOMATION',
      titlePrimary: 'WORLD-CLASS',
      titleSecondary: 'COMMAND GRID 2.0',
      description:
        'Command thousands of robotic Vassal drones, automated conveyor pipelines, and planetary extractors without overwhelming micro-management. Queue multi-stage build workflows, route logistics lines, and execute synchronized orbital drops with intuitive macro commands.',
      actions: [{ text: 'COMMANDS OVERVIEW', href: '/game#commands', variant: 'primary' }],
      img: '/crafting-base.jpg',
      alt: 'Modular Base Workshop and Logistics Hub',
      hudTag: 'MACRO DISPATCH // 0ms INPUT BUFFER',
      statLabel: 'LOGISTICS THROUGHPUT',
      statValue: '10,000+ DISPATCH ORDERS/SEC',
    },
    {
      id: 'tactics',
      align: 'left',
      subtitle: 'ZERO BLOAT ARCHITECTURE',
      titlePrimary: 'RELENTLESS DESIGN',
      titleSecondary: 'UNIQUE WITH PURPOSE',
      description:
        'Every unit, exosuit chassis, and defensive battery serves a distinct tactical role. Mix-and-match modular components to synthesize endless loadouts. Whether mounting surprise cloaked extraction raids or fortifying an impregnable planetary bastion, creativity is your ultimate weapon.',
      actions: [
        { text: 'COMPARE TECH TREES', href: '/game#compare', variant: 'outline' },
        { text: 'EXPLORE FACTIONS', href: '/game#factions', variant: 'primary' },
      ],
      img: '/screenshots/shot8.jpg',
      alt: 'Crafting Fabrication & Planetary Vehicle Bay',
      hudTag: 'TECH TREE REPERTOIRE // T1 - T4 ADVANCED',
      statLabel: 'CUSTOM MODULAR COMBINATIONS',
      statValue: 'OVER 15,000 LOADOUTS',
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
          <div className="section-subtitle">NEXT-GENERATION GAMING // ARCHITECTURE</div>
          <h2 className="section-title">
            PLANETARY STRATEGY <span style={{ color: 'var(--armada-cyan)' }}>REDEFINED</span>
          </h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>
            Every voxel, bullet, and planetary anomaly simulated in real-time on dedicated 60Hz tickrate server architecture.
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

      {/* Embedded Pillar Styles */}
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
