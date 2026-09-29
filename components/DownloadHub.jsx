'use client';

import { useState } from 'react';

export default function DownloadHub() {
  const [specTab, setSpecTab] = useState('recommended');

  const minSpecs = [
    { label: 'Operating System', val: 'Windows 10 / 11 (64-bit) or Ubuntu 22.04+ LTS' },
    { label: 'Processor', val: 'Intel Core i5-8400 or AMD Ryzen 5 2600' },
    { label: 'System Memory', val: '16 GB RAM' },
    { label: 'Graphics Card', val: 'NVIDIA GeForce GTX 1070 (8GB) or AMD Radeon RX 5600 XT' },
    { label: 'DirectX / API', val: 'DirectX 12 / Vulkan 1.3' },
    { label: 'Storage', val: '35 GB available NVMe / SSD storage' },
    { label: 'Broadband', val: 'Broadband Internet connection for 60Hz tickrate multiplayer' },
  ];

  const recSpecs = [
    { label: 'Operating System', val: 'Windows 11 (64-bit) or Modern Linux (Proton / Native Vulkan)' },
    { label: 'Processor', val: 'Intel Core i7-13700K or AMD Ryzen 7 7800X3D' },
    { label: 'System Memory', val: '32 GB High-Speed DDR5 RAM' },
    { label: 'Graphics Card', val: 'NVIDIA GeForce RTX 4070 (12GB) or AMD Radeon RX 7800 XT' },
    { label: 'DirectX / API', val: 'DirectX 12 Ultimate / Vulkan 1.3' },
    { label: 'Storage', val: '35 GB Ultra-Fast PCIe Gen4 NVMe' },
    { label: 'Broadband', val: 'Gigabit Fiber with sub-30ms ping to regional hubs' },
  ];

  return (
    <section
      style={{
        background: '#0a0d14',
        padding: '6rem 0',
        position: 'relative',
        zIndex: 5,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      id="download"
    >
      <div className="container-full">
        {/* Banner Card */}
        <div
          className="hud-frame"
          style={{
            background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
            borderColor: 'var(--armada-cyan)',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            marginBottom: '4rem',
            boxShadow: '0 0 50px rgba(0, 240, 255, 0.15)',
          }}
        >
          <div className="section-subtitle" style={{ justifyContent: 'center' }}>
            STEAM EXCLUSIVE // PC EARLY ACCESS
          </div>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: '1rem',
              color: '#ffffff',
            }}
          >
            READY FOR THE RIFT?{' '}
            <span style={{ color: 'var(--armada-cyan)' }}>WISHLIST ON STEAM</span>
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-dim)',
              maxWidth: '750px',
              margin: '0 auto 2.5rem auto',
              lineHeight: 1.6,
            }}
          >
            Target platform is exclusively Steam (PC) for Early Access and full launch. Engineered with native Steamworks multiplayer lobbies, Steam Cloud blueprint sync, and VAC anticheat.
          </p>

          {/* Platform Launcher Buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <a
              href="https://store.steampowered.com"
              target="_blank"
              rel="noreferrer"
              className="btn-tech btn-tech-primary btn-tech-lg"
              style={{ minWidth: '280px', padding: '1rem 2rem' }}
            >
              <img src="/icons/platform-steam.svg" alt="Steam" width="24" height="24" />
              WISHLIST ON STEAM
            </a>

            <button
              onClick={() => alert('Steam Playtest signups will open soon! Stay tuned on our Discord.')}
              className="btn-tech btn-tech-alt btn-tech-lg"
              style={{ minWidth: '240px' }}
            >
              REQUEST STEAM PLAYTEST
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>WINDOWS 10/11 (64-BIT) PC</span>
            <span>•</span>
            <span>STEAMWORKS SDK INTEGRATION</span>
            <span>•</span>
            <span>VALVE ANTI-CHEAT (VAC)</span>
          </div>
        </div>

        {/* System Requirements Spec Sheet (BAR Style) */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-dim)',
              paddingBottom: '0.75rem',
            }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              HARDWARE SPECIFICATIONS &amp; COMPATIBILITY
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSpecTab('minimum')}
                className="btn-tech btn-tech-sm"
                style={{
                  background: specTab === 'minimum' ? 'var(--armada-cyan)' : 'transparent',
                  color: specTab === 'minimum' ? '#000' : 'var(--text-dim)',
                  borderColor: specTab === 'minimum' ? 'var(--armada-cyan)' : 'var(--border-dim)',
                  fontWeight: 700,
                }}
              >
                MINIMUM SPECS
              </button>
              <button
                onClick={() => setSpecTab('recommended')}
                className="btn-tech btn-tech-sm"
                style={{
                  background: specTab === 'recommended' ? 'var(--armada-cyan)' : 'transparent',
                  color: specTab === 'recommended' ? '#000' : 'var(--text-dim)',
                  borderColor: specTab === 'recommended' ? 'var(--armada-cyan)' : 'var(--border-dim)',
                  fontWeight: 700,
                }}
              >
                RECOMMENDED (60 FPS)
              </button>
            </div>
          </div>

          <div
            className="hud-frame"
            style={{
              background: 'rgba(12, 16, 24, 0.75)',
              padding: '1.5rem 2rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(specTab === 'minimum' ? minSpecs : recSpecs).map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr',
                    gap: '1rem',
                    borderBottom: idx < minSpecs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    paddingBottom: '0.65rem',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--armada-cyan)' }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
