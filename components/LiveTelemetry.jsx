'use client';

import { useState, useEffect } from 'react';

export default function LiveTelemetry() {
  const [pioneers, setPioneers] = useState(18492);
  const [sectors, setSectors] = useState(1420830);
  const [voxels, setVoxels] = useState(89412000);

  useEffect(() => {
    // Subtle live ticker increments
    const interval = setInterval(() => {
      setPioneers((prev) => prev + (Math.floor(Math.random() * 3) - 1));
      setSectors((prev) => prev + Math.floor(Math.random() * 2));
      setVoxels((prev) => prev + Math.floor(Math.random() * 120) + 40);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        background: '#090c12',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.25rem 0',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="container-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
          }}
        >
          {/* Stat 1: Active Pioneers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid var(--border-cyan)',
                clipPath: 'var(--chamfer-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--armada-cyan)',
                fontSize: '1.2rem',
              }}
            >
              🚀
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                // ACTIVE PIONEERS
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {pioneers.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stat 2: Sectors Explored */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(255, 51, 68, 0.1)',
                border: '1px solid var(--border-red)',
                clipPath: 'var(--chamfer-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cortex-red)',
                fontSize: '1.2rem',
              }}
            >
              🪐
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                // STAR SECTORS
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {sectors.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stat 3: Voxels Extracted */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(16, 255, 136, 0.1)',
                border: '1px solid rgba(16, 255, 136, 0.3)',
                clipPath: 'var(--chamfer-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--legion-acid)',
                fontSize: '1.2rem',
              }}
            >
              ⛏️
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                // VOXEL SHARDS
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {(voxels / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>

          {/* Stat 4: Server Latency / Health */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-medium)',
                clipPath: 'var(--chamfer-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.2rem',
              }}
            >
              📡
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                // NETWORK TELEMETRY
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--legion-acid)' }}>
                24ms <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>[60Hz TICK]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
