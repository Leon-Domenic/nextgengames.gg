'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FactionArmory() {
  const [selectedTier, setSelectedTier] = useState('light');
  const [activeTab, setActiveTab] = useState('armor');

  const operatorTiers = {
    light: {
      id: 'light',
      tierName: 'TIER I // LIGHT RECON',
      role: 'Agile Infiltration & Precision Flanking',
      armorType: 'Soft Kevlar & Carbon-Poly Chest Carrier',
      mobility: 95,
      protection: 40,
      adsSpeed: 95,
      stealth: 92,
      audioRadius: '8m (Whisper Quiet)',
      img: '/operators/operator_light.jpg',
      color: 'var(--armada-cyan)',
      glow: 'var(--armada-glow)',
      border: 'var(--border-cyan)',
      weaponKit: 'Suppressed 5.56 Short-Barrel Carbine + Holographic Sight',
      gadget: 'Quantum Telemetry Wrist Scanner (Detects nearby rift tears & heartbeat signatures)',
      perks: [
        '+15% Sprint Agility & Faster Stamina Recovery',
        'Silent Crouch-Walking & Muffled Footstep Audio',
        'Instant ADS & Rapid Weapon Swap Times',
        'Lightweight Rig: Sacrifices heavy plate defense for raw speed',
      ],
    },
    medium: {
      id: 'medium',
      tierName: 'TIER III // MEDIUM ASSAULT',
      role: 'All-Rounder Combat & Anomaly Extraction',
      armorType: 'Boron-Carbide Ceramic Plates (Chest, Back & Ribs)',
      mobility: 75,
      protection: 72,
      adsSpeed: 75,
      stealth: 65,
      audioRadius: '22m (Tactical Combat Audio)',
      img: '/operators/operator_medium.jpg',
      color: 'var(--legion-acid)',
      glow: 'var(--legion-glow)',
      border: 'rgba(16, 255, 136, 0.35)',
      weaponKit: 'Customized Modular Assault Rifle + Angled Grip + Laser Module',
      gadget: 'Pressurized Anomaly Shard Canister (Safely extracts volatile crystals through portals)',
      perks: [
        'Balanced Kinetic Ballistic Absorption across Vital Zones',
        'Quick-Access Plate Swap Pouches (Field-Replaceable Armor)',
        'Versatile Engagement Profile: Effective CQB to Medium Ranges',
        'Carries Heavy Containment Flasks without Speed Penalties',
      ],
    },
    heavy: {
      id: 'heavy',
      tierName: 'TIER V // JUGGERNAUT BREACHER',
      role: 'High-Armor Vault Assault & Boss Suppression',
      armorType: 'Titanium-Alloy Hardplates + Ballistic Neck Collar + Amber Visor',
      mobility: 45,
      protection: 98,
      adsSpeed: 50,
      stealth: 25,
      audioRadius: '45m (Audible Plate Clanking)',
      img: '/operators/operator_heavy.jpg',
      color: 'var(--cortex-red)',
      glow: 'var(--cortex-glow)',
      border: 'var(--border-red)',
      weaponKit: 'Heavy Bullpup Battle Rifle + Integral Suppressor + High-Cap Drum',
      gadget: 'Hardened Blast Visor with Integrated Thermal Target Highlighting',
      perks: [
        'Superior Kinetic & Explosive Blast Deflection',
        'Immunity to Minor Shrapnel & Low-Caliber Pistol Rounds',
        'Substantially Slower Sprint Speed & Heavy Turn Inertia',
        'Intimidation Presence: Unstoppable in Narrow Corridors and Bunker Vaults',
      ],
    },
  };

  const currentOp = operatorTiers[selectedTier];

  return (
    <section
      style={{
        background: '#07090e',
        padding: '6rem 0',
        position: 'relative',
        zIndex: 5,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      id="factions"
    >
      <div className="container-full">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-subtitle">
            OPERATOR LAB // 100% MODULAR FREEDOM
          </div>
          <h2 className="section-title">
            NO PRE-MADE CLASSES.{' '}
            <span style={{ color: currentOp.color }}>FULLY CUSTOMIZABLE.</span>
          </h2>
          <p className="section-desc" style={{ margin: '0 auto', maxWidth: '800px' }}>
            Zero locked hero abilities. Build your operator from the ground up: unlock progressive armor tiers, calibrate every weapon component, and configure your tactical rig for your squad’s mission.
          </p>

          {/* Tier Switcher Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '2.5rem',
            }}
          >
            {Object.keys(operatorTiers).map((key) => {
              const op = operatorTiers[key];
              const isSelected = selectedTier === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedTier(key)}
                  className="btn-tech btn-tech-lg"
                  style={{
                    background: isSelected ? 'rgba(16, 20, 29, 0.95)' : 'rgba(10, 13, 18, 0.7)',
                    borderColor: isSelected ? op.color : 'var(--border-dim)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: isSelected ? `0 0 25px ${op.glow}` : 'none',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: op.color,
                      display: 'inline-block',
                    }}
                  />
                  {op.tierName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Operator Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Character Model Visual Card */}
          <div
            className="hud-frame"
            style={{
              borderColor: currentOp.border,
              boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 35px ${currentOp.glow}`,
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              background: 'radial-gradient(circle at 50% 30%, rgba(20, 26, 38, 0.9) 0%, rgba(8, 10, 15, 0.98) 100%)',
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                aspectRatio: '3/4',
                maxHeight: '560px',
                margin: '0 auto',
              }}
            >
              <img
                src={currentOp.img}
                alt={currentOp.tierName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem 1rem',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: currentOp.color, letterSpacing: '0.15em' }}>
                  {currentOp.tierName}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {currentOp.role}
                </div>
              </div>
            </div>
          </div>

          {/* Operator Specs & Customization Breakdown */}
          <div>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <button
                onClick={() => setActiveTab('armor')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'armor' ? currentOp.color : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  paddingBottom: '0.25rem',
                  borderBottom: activeTab === 'armor' ? `2px solid ${currentOp.color}` : '2px solid transparent',
                }}
              >
                // ARMOR & MOBILITY
              </button>
              <button
                onClick={() => setActiveTab('guns')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'guns' ? currentOp.color : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  paddingBottom: '0.25rem',
                  borderBottom: activeTab === 'guns' ? `2px solid ${currentOp.color}` : '2px solid transparent',
                }}
              >
                // WEAPONRY & GADGETS
              </button>
            </div>

            {activeTab === 'armor' ? (
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ffffff' }}>
                  {currentOp.armorType}
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Locational hitboxes: incoming fire physically hits specific body zones. Ceramic plates shatter realistically under continuous fire, while soft Kevlar maximizes agility for rapid sprint repositions.
                </p>

                {/* Tactical Stats Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>BALLISTIC PROTECTION</span>
                      <span style={{ color: currentOp.color, fontWeight: 700 }}>{currentOp.protection}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${currentOp.protection}%`, height: '100%', background: currentOp.color, boxShadow: `0 0 10px ${currentOp.glow}` }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>SPRINT AGILITY &amp; MOBILITY</span>
                      <span style={{ color: currentOp.color, fontWeight: 700 }}>{currentOp.mobility}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${currentOp.mobility}%`, height: '100%', background: currentOp.color, boxShadow: `0 0 10px ${currentOp.glow}` }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>ADS TRANSITION SPEED</span>
                      <span style={{ color: currentOp.color, fontWeight: 700 }}>{currentOp.adsSpeed}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${currentOp.adsSpeed}%`, height: '100%', background: currentOp.color, boxShadow: `0 0 10px ${currentOp.glow}` }} />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(15, 20, 30, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  <span style={{ color: currentOp.color, fontWeight: 700 }}>ACOUSTIC PROFILE:</span> {currentOp.audioRadius}
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ffffff' }}>
                  GUNSMITH &amp; RIFT TECH
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: currentOp.color, marginBottom: '0.25rem' }}>
                    CONFIGURED WEAPON
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 600 }}>
                    {currentOp.weaponKit}
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: currentOp.color, marginBottom: '0.25rem' }}>
                    TACTICAL SLOTTED GADGET
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {currentOp.gadget}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {currentOp.perks.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                      <span style={{ color: currentOp.color, fontWeight: 900 }}>✓</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Tag */}
            <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--armada-cyan)',
                  letterSpacing: '0.05em',
                }}
              >
                <span>TARGET PLATFORM: STEAM (PC)</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                CS2-GRADE SUB-TICK NETCODE
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
