'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';
import ParticleField from '@/components/ParticleField';

export default function StorePage() {
  const [activeTab, setActiveTab] = useState('All');
  const [cartModal, setCartModal] = useState(null);

  const tabs = ['All', 'Founder Packs', 'Cosmetics', 'Apparel & Collectibles'];

  const products = [
    {
      id: 'founder-deluxe',
      title: 'Pioneer Founder Supreme Edition',
      category: 'Founder Packs',
      price: '$49.99',
      tag: 'Most Popular',
      tagType: 'cyan',
      desc: 'Includes full game, exclusive Void Pioneer spacesuit, 3 beta passes, digital artbook, and official orchestral soundtrack.',
      img: '/merch/founder-pack.png',
      features: ['Immediate Closed Alpha & Beta Access', 'Exclusive Void Pioneer Exosuit Skin', '3 Friend Beta Passes', 'Official FLAC Soundtrack + Artbook'],
    },
    {
      id: 'founder-standard',
      title: 'Standard Explorer Edition',
      category: 'Founder Packs',
      price: '$29.99',
      tag: 'Pre-Order',
      tagType: 'green',
      desc: 'Base game on commercial launch + guaranteed closed beta weekend access and early explorer emblem badge.',
      img: '/screenshots/shot7.jpg',
      features: ['Full Game Digital Copy on Steam', 'Closed Beta Weekend Access', 'Founder Forum Badge & Title', 'Early Access Emblem'],
    },
    {
      id: 'skin-reaper',
      title: 'Void Reaper Heavy Exosuit',
      category: 'Cosmetics',
      price: '$14.99',
      tag: 'Legendary Cosmetic',
      tagType: 'red',
      desc: 'Reinforced deep-space pressurized suit with custom bioluminescent crystal core and jet trail particle VFX.',
      img: '/screenshots/shot6.png',
      features: ['Custom Bioluminescent Core Glow', 'Unique Jetpack Thrust Trails', 'Custom Holographic Visor HUD', 'Universal Chassis Compatibility'],
    },
    {
      id: 'skin-specter',
      title: 'Cobalt Specter Recon Suit',
      category: 'Cosmetics',
      price: '$9.99',
      tag: 'Rare Cosmetic',
      tagType: 'cyan',
      desc: 'Lightweight titanium survey suit engineered for maximum mobility and scanner telemetry range visuals.',
      img: '/screenshots/shot1.png',
      features: ['Carbon Fiber Texture Weave', 'High-Visibility Sensor Accents', 'Custom Armory Emote', 'Compatible with all Factions'],
    },
    {
      id: 'merch-jacket',
      title: 'Aeronautics Division Technical Windbreaker',
      category: 'Apparel & Collectibles',
      price: '$68.00',
      tag: 'Physical Merch',
      tagType: 'green',
      desc: 'Weatherproof technical outerwear featuring woven mission patches, reflective piping, and internal cable loops.',
      img: '/screenshots/shot8.jpg',
      features: ['Water-Resistant DWR Coating', 'Embroidered NextGen Mission Patches', 'Breathable Interior Mesh', 'Ships Worldwide'],
    },
    {
      id: 'merch-pinset',
      title: 'Planetary Survey Enamel Pin Set (4-Pack)',
      category: 'Apparel & Collectibles',
      price: '$24.00',
      tag: 'Physical Merch',
      tagType: 'green',
      desc: 'Four hard enamel pins depicting the core mission emblems: Astra Discovery, Voxel Core, Vassal Companion, and Void Gate.',
      img: '/screenshots/shot4.png',
      features: ['High-Grade Zinc Alloy & Gold Plating', 'Double Rubber Clutch Backing', 'Collector Backing Card Included', 'Official Studio Hologram'],
    },
  ];

  const filtered = activeTab === 'All' ? products : products.filter((p) => p.category === activeTab);

  return (
    <div style={{ background: '#06070a', minHeight: '100vh', position: 'relative' }}>
      <ParticleField count={45} color="cyan" />

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
            SUPPORTER DEPOT // OFFICIAL MERCHANDISE
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            FOUNDER PACKS &amp; <span style={{ color: 'var(--cortex-orange)' }}>GEAR</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Directly support the ongoing development of NextGenGames. Zero pay-to-win mechanics — strictly cosmetics, collector editions, and official studio apparel.
          </p>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="btn-tech btn-tech-sm"
                style={{
                  background: activeTab === tab ? 'var(--armada-cyan)' : 'rgba(16, 20, 29, 0.8)',
                  color: activeTab === tab ? '#000' : 'var(--text-dim)',
                  borderColor: activeTab === tab ? 'var(--armada-cyan)' : 'var(--border-dim)',
                  fontWeight: 800,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Products Grid */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-full">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2.5rem',
            }}
          >
            {filtered.map((product) => (
              <div
                key={product.id}
                className="hud-frame"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={product.img}
                      alt={product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(6, 8, 12, 0.9)',
                        padding: '0.25rem 0.6rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color:
                          product.tagType === 'red'
                            ? 'var(--cortex-red)'
                            : product.tagType === 'green'
                            ? 'var(--legion-acid)'
                            : 'var(--armada-cyan)',
                        borderLeft: `2px solid ${
                          product.tagType === 'red'
                            ? 'var(--cortex-red)'
                            : product.tagType === 'green'
                            ? 'var(--legion-acid)'
                            : 'var(--armada-cyan)'
                        }`,
                      }}
                    >
                      {product.tag}
                    </div>
                  </div>

                  <div style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.65rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {product.category}
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--cortex-orange)' }}>
                        {product.price}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                      {product.title}
                    </h2>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {product.desc}
                    </p>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                      {product.features.map((feat, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span style={{ color: 'var(--legion-acid)' }}>✓</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ padding: '0 1.75rem 1.75rem 1.75rem' }}>
                  <button
                    onClick={() => setCartModal(product)}
                    className="btn-tech btn-tech-primary btn-tech-sm"
                    style={{ width: '100%' }}
                  >
                    ACQUIRE SUPPORTER ITEM →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Confirmation Modal */}
      {cartModal && (
        <div
          onClick={() => setCartModal(null)}
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
            className="hud-frame"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#0d1017',
              borderColor: 'var(--armada-cyan)',
              padding: '2.5rem',
              boxShadow: '0 0 50px rgba(0, 240, 255, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="hud-badge hud-badge-cyan">ORDER SUMMARY</span>
              <button
                onClick={() => setCartModal(null)}
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                [CLOSE ✕]
              </button>
            </div>

            <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.5rem' }}>
              {cartModal.title}
            </h3>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--cortex-orange)', fontWeight: 900, marginBottom: '1.25rem' }}>
              {cartModal.price}
            </div>

            <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {cartModal.desc}
            </p>

            <button
              onClick={() => {
                alert(`Thank you for acquiring ${cartModal.title}! Your transmission voucher has been registered.`);
                setCartModal(null);
              }}
              className="btn-tech btn-tech-primary btn-tech-lg"
              style={{ width: '100%' }}
            >
              COMPLETE ENLISTMENT &amp; PAY →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
