'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FactionArmory() {
  const [activeFaction, setActiveFaction] = useState('armada');
  const [activeCategory, setActiveCategory] = useState('all');

  const factions = {
    armada: {
      name: 'ARMADA VANGUARD',
      subtitle: 'Aerospace Dominance & Precision Terraforming',
      color: 'var(--armada-cyan)',
      glow: 'var(--armada-glow)',
      border: 'var(--border-cyan)',
      lore: 'The pioneer core of early colonial expansion. Armada engineers utilize high-velocity kinetic railguns, advanced aerodynamic dropships, and solar micro-fusion arrays.',
    },
    cortex: {
      name: 'CORTEX SYNDICATE',
      subtitle: 'Heavy Mechanized Cyber-Assault Swarms',
      color: 'var(--cortex-red)',
      glow: 'var(--cortex-glow)',
      border: 'var(--border-red)',
      lore: 'An industrial conglomerate focused on sheer mechanical mass. Cortex deploys heavily armored bipedal walkers, incendiary plasma mortars, and relentless automated drone swarms.',
    },
    aetherion: {
      name: 'AETHERION VOIDFARERS',
      subtitle: 'Quantum Phase Shifts & Dimensional Energy',
      color: 'var(--legion-acid)',
      glow: 'var(--legion-glow)',
      border: 'rgba(16, 255, 136, 0.3)',
      lore: 'Mysterious deep-space salvagers who unlocked dark crystal anomalies. Aetherion units manipulate phase stealth, dimensional blink gates, and concentrated tachyon beams.',
    },
  };

  const units = [
    {
      id: 'vassal-recon',
      faction: 'armada',
      category: 'bots',
      name: 'Vassal Recon Scout',
      tier: 'Tier 1 Bot',
      role: 'Fast Telemetry & Resource Pinging',
      firepower: 45,
      armor: 50,
      mobility: 95,
      range: 70,
      img: '/screenshots/shot4.png',
      desc: 'Lightweight autonomous rover drone capable of scaling 70° voxel slopes to establish early radar lines-of-sight.',
    },
    {
      id: 'armada-titan',
      faction: 'armada',
      category: 'vehicles',
      name: 'Valiant Siege Rover',
      tier: 'Tier 3 Heavy Vehicle',
      role: 'Long-Range Kinetic Railgun Platform',
      firepower: 92,
      armor: 85,
      mobility: 55,
      range: 98,
      img: '/screenshots/shot8.jpg',
      desc: 'Heavy dual-tracked mobile fortress equipped with magnetic mass-drivers capable of leveling enemy bunkers from afar.',
    },
    {
      id: 'armada-dropship',
      faction: 'armada',
      category: 'aircraft',
      name: 'Skyhook Orbital Dropship',
      tier: 'Tier 2 Aircraft',
      role: 'Rapid Vassal Deployment & Air Escort',
      firepower: 65,
      armor: 70,
      mobility: 90,
      range: 80,
      img: '/screenshots/shot5.png',
      desc: 'Atmospheric transport fitted with counter-gravity thrusters to ferry extraction payloads across contested hazard sectors.',
    },
    {
      id: 'cortex-colossus',
      faction: 'cortex',
      category: 'bots',
      name: 'Cortex Dreadnought Walker',
      tier: 'Tier 3 Super-Heavy Biped',
      role: 'Frontline Armor Breaker',
      firepower: 96,
      armor: 98,
      mobility: 40,
      range: 75,
      img: '/screenshots/shot6.png',
      desc: 'Massive hydraulic war machine carrying dual thermal incinerator pods and seismic shockwave ground-pounders.',
    },
    {
      id: 'cortex-crusher',
      faction: 'cortex',
      category: 'vehicles',
      name: 'Goliath Mining Juggernaut',
      tier: 'Tier 2 Heavy Vehicle',
      role: 'Heavy Terraforming & Frontline Ram',
      firepower: 80,
      armor: 92,
      mobility: 60,
      range: 50,
      img: '/screenshots/shot2.png',
      desc: 'Armored multi-wheel chassis designed to crush trenches, breach compound walls, and chew through mineral veins.',
    },
    {
      id: 'cortex-battery',
      faction: 'cortex',
      category: 'defenses',
      name: 'Hellfire Flak Turret Array',
      tier: 'Tier 2 Defense',
      role: 'Area-of-Effect Anti-Air & Anti-Drone',
      firepower: 88,
      armor: 80,
      mobility: 0,
      range: 85,
      img: '/screenshots/shot3.png',
      desc: 'Rapid-firing rotary cannon battery firing proximity airburst shrapnel to wipe out hostile fighter swarms.',
    },
    {
      id: 'aetherion-void-stalker',
      faction: 'aetherion',
      category: 'bots',
      name: 'Phase Stalker Infiltrator',
      tier: 'Tier 2 Phase Bot',
      role: 'Cloaked Incursion & Sabotage',
      firepower: 84,
      armor: 45,
      mobility: 92,
      range: 65,
      img: '/screenshots/shot1.png',
      desc: 'Equipped with quantum refraction shielding that renders the unit invisible on radar until weapons discharge.',
    },
    {
      id: 'aetherion-rift-station',
      faction: 'aetherion',
      category: 'defenses',
      name: 'Tachyon Rift Beacon',
      tier: 'Tier 3 Megastructure',
      role: 'Planetary Teleportation & Extraction Hub',
      firepower: 60,
      armor: 90,
      mobility: 0,
      range: 100,
      img: '/screenshots/shot7.jpg',
      desc: 'Spire-class megastructure capable of warping reinforcements directly from orbital fleet docks onto the battlefield.',
    },
  ];

  const currentFactionData = factions[activeFaction];

  const filteredUnits = units.filter((u) => {
    const matchFaction = u.faction === activeFaction;
    const matchCat = activeCategory === 'all' || u.category === activeCategory;
    return matchFaction && matchCat;
  });

  return (
    <section
      style={{
        background: '#07090e',
        padding: '6rem 0',
        position: 'relative',
        zIndex: 5,
      }}
      id="factions"
    >
      <div className="container-full">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-subtitle">UNITS &amp; TECH MATRIX // DATABASE</div>
          <h2 className="section-title">
            PLAYABLE <span style={{ color: currentFactionData.color }}>FACTIONS &amp; ARSENAL</span>
          </h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>
            Choose your doctrine. Over 200 modular units across 3 distinct tech trees with dedicated tactical roles.
          </p>

          {/* Faction Switcher */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '2.5rem',
            }}
          >
            {Object.keys(factions).map((key) => {
              const fac = factions[key];
              const isSelected = activeFaction === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveFaction(key)}
                  className="btn-tech btn-tech-lg"
                  style={{
                    background: isSelected ? 'rgba(16, 20, 29, 0.95)' : 'rgba(10, 13, 18, 0.7)',
                    borderColor: isSelected ? fac.color : 'var(--border-dim)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: isSelected ? `0 0 25px ${fac.glow}` : 'none',
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: fac.color,
                      display: 'inline-block',
                    }}
                  />
                  {fac.name}
                </button>
              );
            })}
          </div>

          {/* Active Faction Lore Summary Card */}
          <div
            className="hud-frame"
            style={{
              maxWidth: '850px',
              margin: '2rem auto 0 auto',
              textAlign: 'left',
              borderColor: currentFactionData.border,
              boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 25px ${currentFactionData.glow}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: currentFactionData.color, letterSpacing: '0.15em' }}>
                // FACTION DOCTRINE: {currentFactionData.name}
              </span>
              <span className="hud-badge" style={{ color: currentFactionData.color, borderColor: currentFactionData.color }}>
                {currentFactionData.subtitle}
              </span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {currentFactionData.lore}
            </p>
          </div>
        </div>

        {/* Unit Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '3rem',
          }}
        >
          {[
            { id: 'all', label: 'ALL CLASSES' },
            { id: 'bots', label: 'BOTS & DRONES' },
            { id: 'vehicles', label: 'HEAVY VEHICLES' },
            { id: 'aircraft', label: 'AIRCRAFT & DROPSHIPS' },
            { id: 'defenses', label: 'DEFENSES & MEGASTRUCTURES' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="btn-tech btn-tech-sm"
              style={{
                background: activeCategory === cat.id ? 'var(--bg-surface-elevated)' : 'transparent',
                borderColor: activeCategory === cat.id ? currentFactionData.color : 'var(--border-dim)',
                color: activeCategory === cat.id ? currentFactionData.color : 'var(--text-dim)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Units Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="hud-frame unit-card"
              style={{
                padding: 0,
                overflow: 'hidden',
                borderColor: currentFactionData.border,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Unit Image & Tier Tag */}
              <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={unit.img}
                  alt={unit.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'contrast(1.1) brightness(0.9)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(6, 8, 12, 0.9)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: currentFactionData.color,
                    padding: '0.25rem 0.6rem',
                    borderLeft: `2px solid ${currentFactionData.color}`,
                  }}
                >
                  {unit.tier}
                </div>
              </div>

              {/* Unit Specs & Data */}
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {unit.role}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                    {unit.name}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                    {unit.desc}
                  </p>
                </div>

                {/* Stat Bars */}
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'FIREPOWER', value: unit.firepower },
                      { label: 'ARMOR CHASSIS', value: unit.armor },
                      { label: 'MOBILITY', value: unit.mobility },
                      { label: 'OPERATIONAL RANGE', value: unit.range },
                    ].map((stat, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          <span>{stat.label}</span>
                          <span style={{ color: '#fff' }}>{stat.value}/100</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${stat.value}%`,
                              height: '100%',
                              background: currentFactionData.color,
                              boxShadow: `0 0 8px ${currentFactionData.glow}`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/game#compare"
                    className="btn-tech btn-tech-sm"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'var(--border-dim)',
                    }}
                  >
                    COMPARE TACTICAL SPECS →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
