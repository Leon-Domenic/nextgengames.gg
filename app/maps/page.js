'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';

export default function MapsPage() {
  const [filter, setFilter] = useState('all');

  const maps = [
    {
      id: 'pyroclast',
      category: 'large',
      name: 'Pyroclast Prime',
      type: 'Volcanic Rift Caldera',
      players: '8 - 16 Players',
      size: '24km x 24km',
      hazard: 'Class-IV Thermal Eruptions',
      img: '/screenshots/shot5.png',
      desc: 'Active molten basalt flows create natural strategic choke points. Tapping high-output geothermal fissures grants explosive energy, but eruptions trigger catastrophic terrain collapse.',
      resources: 'Rich Dark Crystal, High Geothermal, Low Water',
      recomComp: 'Cortex Heavy Walkers & Armada Shielded Tanks',
    },
    {
      id: 'valkyrie',
      category: 'medium',
      name: 'Valkyrie Ridge',
      type: 'Alpine Glacial Peaks',
      players: '4 - 8 Players',
      size: '16km x 16km',
      hazard: 'Class-II Blizzard & Radar Occlusion',
      img: '/screenshots/shot7.jpg',
      desc: 'Steep granite mountain ranges occlude ground radar telemetry. High-ground ridge perches provide lethal line-of-sight for long-range kinetic artillery.',
      resources: 'Abundant Titanium, Moderate Solar, High Wind',
      recomComp: 'Armada Skyhook Dropships & Railgun Rovers',
    },
    {
      id: 'sector4',
      category: 'small',
      name: 'Sector 4 Abyss',
      type: 'Subterranean Crystal Cavern',
      players: '2 - 6 Players',
      size: '12km x 12km',
      hazard: 'Class-V Void Rift Destabilization',
      img: '/screenshots/shot1.png',
      desc: 'Dark subterranean hollows rich in high-purity dark crystals. Commanders must dig deep underground tunnel networks to flank contested central extraction gates.',
      resources: 'Extreme Crystal Density, Zero Solar, High Geothermal',
      recomComp: 'Aetherion Phase Stalkers & Cortex Tunnel Borers',
    },
    {
      id: 'cobalt',
      category: 'large',
      name: 'Cobalt Expanse',
      type: 'Deep Ocean Archipelago',
      players: '8 - 16 Players',
      size: '32km x 32km',
      hazard: 'Class-I Tidal Surges',
      img: '/screenshots/shot8.jpg',
      desc: 'Scattered island atolls separated by deep oceanic trenches. Naval hovercraft and amphibious armor are essential to conquer offshore automated mining platforms.',
      resources: 'Balanced Minerals, High Tidal Energy, High Solar',
      recomComp: 'Armada Amphibious Fleets & Orbital Gunships',
    },
    {
      id: 'dune',
      category: 'medium',
      name: 'Oasis of Rust',
      type: 'High-Velocity Dune Sea',
      players: '4 - 8 Players',
      size: '18km x 18km',
      hazard: 'Class-III Sandstorms (Sensor Jamming)',
      img: '/screenshots/shot3.png',
      desc: 'Violent shifting sandstorms periodically blind radar and optical targeting. Swift flanking maneuvers and mobile construction convoys excel across flat salt flats.',
      resources: 'High Solar, Low Water, Moderate Crystal',
      recomComp: 'High-Mobility Vassal Buggies & Recon Bots',
    },
    {
      id: 'orbital',
      category: 'small',
      name: 'Lagrange Platform 09',
      type: 'Shattered Asteroid Complex',
      players: '2 - 4 Players',
      size: '10km x 10km',
      hazard: 'Class-IV Zero-G Micrometeoroids',
      img: '/screenshots/shot2.png',
      desc: 'Low-gravity modular space station ruins suspended in orbit. Magnetic boots and rocket thrusters govern movement across shattered docking struts.',
      resources: 'Pure Orbital Alloy, Extreme Solar, Zero Atmosphere',
      recomComp: 'Exosuit Shock Troopers & Drone Swarms',
    },
  ];

  const filtered = filter === 'all' ? maps : maps.filter((m) => m.category === filter);

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
            SECTOR DATABASE // STAR CHARTS
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            PLANETARY <span style={{ color: 'var(--armada-cyan)' }}>MAPS &amp; WORLDS</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Explore our curated roster of procedural planetary battlegrounds. Every map features fully deformable voxel terrain, distinct weather simulations, and tactical elevation mechanics.
          </p>

          {/* Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'ALL MAPS' },
              { id: 'small', label: '1v1 - 3v3 DUELS (10-12KM)' },
              { id: 'medium', label: '4v4 - 8v8 SQUADS (16-18KM)' },
              { id: 'large', label: '8v8 - 16v16 MASSIVE FLEETS (24-32KM)' },
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

      {/* Maps Grid */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-full">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '2.5rem',
            }}
          >
            {filtered.map((map) => (
              <div
                key={map.id}
                className="hud-frame"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={map.img}
                    alt={map.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(6, 8, 12, 0.9)',
                      padding: '0.3rem 0.6rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--armada-cyan)',
                      borderLeft: '2px solid var(--armada-cyan)',
                    }}
                  >
                    {map.players} // {map.size}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: 'rgba(6, 8, 12, 0.9)',
                      padding: '0.3rem 0.6rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--cortex-red)',
                    }}
                  >
                    {map.hazard}
                  </div>
                </div>

                <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      // BIOME: {map.type}
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                      {map.name}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {map.desc}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      RESOURCES: <span style={{ color: '#fff' }}>{map.resources}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      RECOMMENDED COMP: <span style={{ color: 'var(--armada-cyan)' }}>{map.recomComp}</span>
                    </div>
                    <Link href="/#download" className="btn-tech btn-tech-outline-cyan btn-tech-sm" style={{ width: '100%' }}>
                      LAUNCH MAP IN ALPHA LOBBY →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
