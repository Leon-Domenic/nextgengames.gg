'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';
import ParticleField from '@/components/ParticleField';

export default function LorePage() {
  const [translated, setTranslated] = useState({
    c1: false,
    c2: false,
    c3: false,
  });

  const toggleTranslate = (key) => {
    setTranslated((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ background: '#06070a', minHeight: '100vh', position: 'relative' }}>
      <ParticleField count={45} color="cyan" />

      {/* Header Banner */}
      <section
        style={{
          position: 'relative',
          padding: '8rem 0 4rem 0',
          background: 'linear-gradient(180deg, #040508 0%, #0a0d14 100%)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div className="container-full" style={{ position: 'relative', zIndex: 10 }}>
          <div className="section-subtitle" style={{ justifyContent: 'center' }}>
            UNIVERSE CODEX // CHRONICLE 01
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: '1rem',
            }}
          >
            BEYOND THE <span style={{ color: 'var(--armada-cyan)' }}>OUTER RIM</span>
          </h1>
          <p
            style={{
              fontSize: '1.2rem',
              color: 'var(--text-dim)',
              maxWidth: '720px',
              margin: '0 auto 2rem auto',
              lineHeight: 1.6,
            }}
          >
            The official historical chronicles of the 25th-century planetary rift expansion. Click transmission headers below to decrypt alien telemetry.
          </p>

          <div style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>AUTHOR: EXPEDITION ARCHIVIST</span>
            <span>•</span>
            <span>CLEARANCE: LEVEL-5 PIONEER</span>
            <span>•</span>
            <span style={{ color: 'var(--legion-acid)' }}>[DECRYPT ENGINE: READY]</span>
          </div>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Lore Content Section */}
      <section style={{ padding: '5rem 0', position: 'relative', zIndex: 10 }}>
        <div className="container-full" style={{ maxWidth: '960px' }}>
          {/* Chapter 1 */}
          <article className="hud-frame" style={{ marginBottom: '3rem', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="hud-badge hud-badge-cyan">LOG ENTRY 2491.04</span>
              <button
                onClick={() => toggleTranslate('c1')}
                className="btn-tech btn-tech-sm btn-tech-outline-cyan"
              >
                {translated.c1 ? '↺ RESTORE ORIGINAL CIPHER' : '⚡ DECRYPT QUANTUM TRANSMISSION'}
              </button>
            </div>

            <h2
              style={{
                fontSize: '1.8rem',
                color: translated.c1 ? 'var(--armada-cyan)' : '#ffffff',
                marginBottom: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s var(--ease-smooth)',
                letterSpacing: translated.c1 ? '0.04em' : '0.12em',
              }}
              onClick={() => toggleTranslate('c1')}
            >
              {translated.c1
                ? 'CHAPTER 1: THE GREAT DIMENSIONAL RUPTURE'
                : '§ 01: ⌬ ⏣ ⎔ QUANTUM ANOMALY DETECTED IN SECTOR 4'}
            </h2>

            <div style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.75 }}>
              <p style={{ marginBottom: '1.25rem' }}>
                When the first deep-space quantum tunneling probes pierced through the Lagrange Void in 2489, they did not discover inert mineral belts. Instead, they awoke a living resonance. Planetoids throughout Sector 4 began destabilizing at a molecular level, fracturing into raw voxel grids that could be carved, reassembled, and magnetized through high-energy plasma fields.
              </p>
              <p>
                {translated.c1 ? (
                  <span style={{ color: '#ffffff', background: 'rgba(0, 240, 255, 0.08)', padding: '0.4rem', borderLeft: '3px solid var(--armada-cyan)' }}>
                    &ldquo;The surface does not resist our drills; it computes our intentions. Every trench excavated by our rovers echoes through the planetary core like a digital heartbeat.&rdquo; — Pioneer Commander Elena Vance
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    [CIPHER LOCK]: 01010110 01001111 01011000 01000101 01001100 — Click Decrypt to read Pioneer Commander Elena Vance&apos;s audio log transcript.
                  </span>
                )}
              </p>
            </div>
          </article>

          {/* Chapter 2 */}
          <article className="hud-frame" style={{ marginBottom: '3rem', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="hud-badge hud-badge-red">LOG ENTRY 2493.11</span>
              <button
                onClick={() => toggleTranslate('c2')}
                className="btn-tech btn-tech-sm btn-tech-red"
              >
                {translated.c2 ? '↺ RESTORE ORIGINAL CIPHER' : '⚡ DECRYPT QUANTUM TRANSMISSION'}
              </button>
            </div>

            <h2
              style={{
                fontSize: '1.8rem',
                color: translated.c2 ? 'var(--cortex-red)' : '#ffffff',
                marginBottom: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s var(--ease-smooth)',
                letterSpacing: translated.c2 ? '0.04em' : '0.12em',
              }}
              onClick={() => toggleTranslate('c2')}
            >
              {translated.c2
                ? 'CHAPTER 2: THE SCHISM OF THREE DOCTRINES'
                : '§ 02: ⎕ ⏢ ⎈ CORTEX PROTOCOL INITIATED // SWARM AWAKENING'}
            </h2>

            <div style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.75 }}>
              <p style={{ marginBottom: '1.25rem' }}>
                Unity among the colony expedition lasted less than three solar cycles. As the value of Dark Crystal shards soared, three irreconcilable philosophical doctrines emerged:
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <li style={{ borderLeft: '3px solid var(--armada-cyan)', paddingLeft: '1rem' }}>
                  <strong style={{ color: 'var(--armada-cyan)' }}>Armada Vanguard:</strong> Believers in disciplined aerospace infrastructure, clean terraforming ethics, and synchronized kinetic railgun defense.
                </li>
                <li style={{ borderLeft: '3px solid var(--cortex-red)', paddingLeft: '1rem' }}>
                  <strong style={{ color: 'var(--cortex-red)' }}>Cortex Syndicate:</strong> Relentless industrial pragmatists who replace organic fragility with colossal hydraulic walker chassis and devastating swarm automation.
                </li>
                <li style={{ borderLeft: '3px solid var(--legion-acid)', paddingLeft: '1rem' }}>
                  <strong style={{ color: 'var(--legion-acid)' }}>Aetherion Voidfarers:</strong> Monastic deep-space hackers who merge their consciousness with phase rift anomalies to bypass physical matter entirely.
                </li>
              </ul>
            </div>
          </article>

          {/* Chapter 3 */}
          <article className="hud-frame" style={{ marginBottom: '3rem', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="hud-badge hud-badge-green">LOG ENTRY 2496.02</span>
              <button
                onClick={() => toggleTranslate('c3')}
                className="btn-tech btn-tech-sm btn-tech-outline-cyan"
                style={{ borderColor: 'var(--legion-acid)', color: 'var(--legion-acid)' }}
              >
                {translated.c3 ? '↺ RESTORE ORIGINAL CIPHER' : '⚡ DECRYPT QUANTUM TRANSMISSION'}
              </button>
            </div>

            <h2
              style={{
                fontSize: '1.8rem',
                color: translated.c3 ? 'var(--legion-acid)' : '#ffffff',
                marginBottom: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s var(--ease-smooth)',
                letterSpacing: translated.c3 ? '0.04em' : '0.12em',
              }}
              onClick={() => toggleTranslate('c3')}
            >
              {translated.c3
                ? 'CHAPTER 3: THE EXTRACTION WARS'
                : '§ 03: ⏣ ⎔ ⏢ DARK CRYSTAL CONVERGENCE AT CRATER 09'}
            </h2>

            <div style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.75 }}>
              <p style={{ marginBottom: '1.25rem' }}>
                Today, Sector 4 is a living testing ground. Every planetary expedition represents a high-stakes struggle where commanders land, deploy automated Vassal networks, dig deep subterranean bunkers, and battle for total territorial control before the planetary rift collapses.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <Link href="/#download" className="btn-tech btn-tech-primary btn-tech-lg">
                  ENLIST IN THE EXPEDITION FLEET →
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
