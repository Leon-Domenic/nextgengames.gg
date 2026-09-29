'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';
import ParticleField from '@/components/ParticleField';

export default function GamePage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedShot, setSelectedShot] = useState(null);

  const galleryItems = [
    { src: '/screenshots/shot7.jpg', caption: 'Planetary Rift Survey — Sector 4 Caldera' },
    { src: '/screenshots/shot8.jpg', caption: 'Modular Heavy Vehicle Fabrication Bay' },
    { src: '/screenshots/shot2.png', caption: 'Multiplayer Fortress Assault & Voxel Cratering' },
    { src: '/screenshots/shot3.png', caption: 'Automated Redoubt Defense & Solar Trackers' },
    { src: '/screenshots/shot4.png', caption: 'Autonomous Vassal Robotic Companion Swarm' },
    { src: '/screenshots/shot5.png', caption: 'Dimensional Collision Event & Extraction Gate' },
    { src: '/screenshots/shot1.png', caption: 'Void Gate & Horizon Crystal Anomaly' },
    { src: '/screenshots/shot6.png', caption: 'Titan Walker Factory & Exosuit Armory' },
  ];

  const pillars = [
    {
      title: 'Planetary Voxel Terraforming',
      desc: 'Land on untouched, procedurally sculpted worlds. Every hill, trench, and cavern can be physically excavated, reinforced, or collapsed by kinetic artillery.',
      icon: '🪐',
      hud: 'VOXEL RESOLUTION: 0.1M',
    },
    {
      title: 'Modular Base Architecture',
      desc: 'Snap together automated habitat hubs, solar arrays, smelters, and subterranean launch bays using intuitive magnetic coupling connectors.',
      icon: '🏗️',
      hud: 'SOCKET CONNECTIVITY: 100%',
    },
    {
      title: 'Autonomous Vassal Robotics',
      desc: 'Program and dispatch robotic drone crews to run automated mining sweeps, recharge generator batteries, and patrol perimeter walls 24/7.',
      icon: '🤖',
      hud: 'AI PROTOCOL: LEVEL-4 AUTONOMOUS',
    },
    {
      title: 'High-Risk Dimensional Extraction',
      desc: 'Deploy through quantum rift gates to contested outer-rim sectors. Extract high-density dark crystals and exfiltrate before dimensional collapse.',
      icon: '🌀',
      hud: 'STABILITY: MONITORED',
    },
  ];

  const roadmapMilestones = [
    { phase: 'PHASE 01 // Q2 2026', title: 'Closed Alpha Playtest', status: 'COMPLETED', desc: 'Core Unreal Engine 5 voxel netcode, dedicated server cluster, and 3 base factions.' },
    { phase: 'PHASE 02 // Q3 2026', title: 'Expanded Fleet Warfare', status: 'ACTIVE', desc: '16-player multiplayer lobbies, spectator telemetry, and custom subterranean trenching tools.' },
    { phase: 'PHASE 03 // Q4 2026', title: 'Steam Early Access Launch', status: 'UPCOMING', desc: 'Global launch on Steam with cross-play across Windows and native Linux, player rank ladder, and custom map editor.' },
    { phase: 'PHASE 04 // 2027', title: 'Console Expansion & Megastructures', status: 'PLANNED', desc: 'PlayStation 5 and Xbox Series X|S releases, orbital superweapon defense lattices, and planetary campaign scenarios.' },
  ];

  const faqs = [
    {
      q: 'What engine and physics system powers NextGenGames?',
      a: 'NextGenGames is engineered on Unreal Engine 5, combining Lumen dynamic global illumination and Nanite geometry with our proprietary multithreaded compute shader voxel deformation engine.',
    },
    {
      q: 'Can players host private dedicated servers?',
      a: 'Yes! While NextGenGames hosts low-latency regional official clusters (60Hz tickrate), we provide standalone server binaries for Windows and Linux with full modding and tournament telemetry APIs.',
    },
    {
      q: 'How does the terrain destruction affect combat line-of-sight?',
      a: 'Terrain occlusion is physically calculated. Artillery craters create tactical hull-down cover for rovers, volcanic ridges block enemy radar scans, and digging tunnels enables subterranean sneak attacks beneath enemy defense walls.',
    },
    {
      q: 'Is NextGenGames free-to-play?',
      a: 'The core multiplayer Alpha playtest is free to download and play for all registered pioneers. Optional supporter Founder Packs provide permanent cosmetic exosuits, titles, and artbooks without pay-to-win mechanics.',
    },
    {
      q: 'What are the minimum system requirements?',
      a: 'A modern quad-core CPU (Intel i5-8400 / Ryzen 5 2600), 16 GB RAM, and a GTX 1070 or RX 5600 XT with 35 GB available SSD storage.',
    },
  ];

  return (
    <div style={{ background: '#06070a', minHeight: '100vh', position: 'relative' }}>
      <ParticleField count={40} color="cyan" />

      {/* Hero Header */}
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
            ENGINEERING &amp; SIMULATION // DEEP DIVE
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            GAMEPLAY <span style={{ color: 'var(--armada-cyan)' }}>SYSTEMS &amp; ARCHITECTURE</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '750px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            An aerospace simulation and planetary extraction sandbox spanning infinite procedural star systems. Built from the ground up for massive simulated battles.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="#pillars" className="btn-tech btn-tech-primary btn-tech-sm">
              EXPLORATION PILLARS
            </Link>
            <Link href="#screenshots" className="btn-tech btn-tech-alt btn-tech-sm">
              4K MEDIA VAULT
            </Link>
            <Link href="#roadmap" className="btn-tech btn-tech-outline-cyan btn-tech-sm">
              RELEASE ROADMAP
            </Link>
            <Link href="#faq" className="btn-tech btn-tech-alt btn-tech-sm">
              FAQ &amp; CODE OF CONDUCT
            </Link>
          </div>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Core Exploration Pillars */}
      <section style={{ padding: '6rem 0' }} id="pillars">
        <div className="container-full">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-subtitle">CORE PILLARS // AEROSPACE EXTRACTION</div>
            <h2 className="section-title">THE CORNERSTONES OF PROJECT X</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {pillars.map((p, i) => (
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
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{p.icon}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--armada-cyan)', marginBottom: '0.4rem' }}>
                    //{p.hud}
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.85rem' }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4K Screenshot Gallery */}
      <section style={{ padding: '6rem 0', background: '#080a0f' }} id="screenshots">
        <div className="container-full">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-subtitle">VISUAL FIDELITY // IN-ENGINE CAPTURES</div>
            <h2 className="section-title">
              4K ULTRA-HD <span style={{ color: 'var(--armada-cyan)' }}>MEDIA VAULT</span>
            </h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Captured directly from live 60fps multiplayer Alpha sessions running on high-tier hardware. Click any image to inspect in full resolution.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedShot(item)}
                className="hud-frame"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <img
                  src={item.src}
                  alt={item.caption}
                  style={{
                    width: '100%',
                    height: '220px',
                    objectFit: 'cover',
                    transition: 'transform 0.4s var(--ease-out-expo)',
                  }}
                  className="gallery-thumb"
                />
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(10, 13, 18, 0.95)',
                    borderTop: '1px solid var(--border-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{item.caption}</span>
                  <span style={{ color: 'var(--armada-cyan)' }}>[VIEW 🔍]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steam Release Roadmap */}
      <section style={{ padding: '6rem 0' }} id="roadmap">
        <div className="container-full">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="section-subtitle">DEVELOPMENT TIMELINE // MILESTONES</div>
            <h2 className="section-title">
              STEAM &amp; CONSOLE <span style={{ color: 'var(--armada-cyan)' }}>ROADMAP</span>
            </h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Our transparent development plan moving through closed alpha playtests to global commercial launch.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {roadmapMilestones.map((m, idx) => (
              <div key={idx} className="hud-frame" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--armada-cyan)' }}>
                    {m.phase}
                  </span>
                  <span
                    className={`hud-badge ${
                      m.status === 'COMPLETED'
                        ? 'hud-badge-green'
                        : m.status === 'ACTIVE'
                        ? 'hud-badge-cyan'
                        : 'hud-badge-red'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & Code of Conduct Accordion */}
      <section style={{ padding: '6rem 0', background: '#080a0f' }} id="faq">
        <div className="container-full" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-subtitle">KNOWLEDGE BASE // FREQUENTLY ASKED QUESTIONS</div>
            <h2 className="section-title">TECHNICAL INTEL &amp; FAIR PLAY</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;

              return (
                <div
                  key={idx}
                  className="hud-frame"
                  style={{
                    padding: '1.5rem 2rem',
                    cursor: 'pointer',
                    borderColor: isOpen ? 'var(--armada-cyan)' : 'var(--border-dim)',
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem', color: isOpen ? 'var(--armada-cyan)' : '#fff', fontWeight: 700 }}>
                      {faq.q}
                    </h3>
                    <span style={{ color: 'var(--armada-cyan)', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-dim)', paddingTop: '1rem', color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedShot && (
        <div
          onClick={() => setSelectedShot(null)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(4, 5, 8, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '1100px',
              width: '100%',
              background: '#000',
              border: '2px solid var(--armada-cyan)',
              clipPath: 'var(--chamfer-md)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setSelectedShot(null)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                background: 'rgba(0, 0, 0, 0.75)',
                padding: '0.3rem 0.7rem',
                border: '1px solid var(--border-dim)',
                zIndex: 10,
              }}
            >
              [CLOSE ✕]
            </button>
            <img src={selectedShot.src} alt={selectedShot.caption} style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ padding: '1rem 1.5rem', background: '#0a0d14', borderTop: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--armada-cyan)' }}>
              {selectedShot.caption}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gallery-thumb:hover {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
