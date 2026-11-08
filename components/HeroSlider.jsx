'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ParticleField from './ParticleField';
import CrumbleDivider from './CrumbleDivider';

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const slides = [
    {
      id: 0,
      badge: 'UNIVERSE CHRONICLE // SECTOR 4',
      badgeColor: 'cyan',
      titlePrimary: 'BEYOND',
      titleSecondary: 'THE OUTER RIM',
      subtitle: 'The 25th-century voxel expedition lore is here. Be among the first to explore untouched planetary frontiers, uncover dark crystal anomalies, and colonize distant solar systems.',
      bgImage: '/astroneer-hero.jpg',
      ctaPrimary: { text: 'EXPLORE THE UNIVERSE', href: '/lore', variant: 'cyan' },
      ctaSecondary: { text: 'PLAY FOR FREE', href: '#download', variant: 'primary' },
      particleColor: 'cyan',
    },
    {
      id: 1,
      badge: 'MASSIVE MULTIPLAYER ECOSYSTEM',
      badgeColor: 'red',
      titlePrimary: 'COMMAND THOUSANDS',
      titleSecondary: 'OF AUTONOMOUS UNITS',
      subtitle: 'Construct sprawling subterranean refineries, orchestrate robotic vassal swarms, and engage in high-octane 16-player PvPvE planetary extraction warfare.',
      bgImage: '/combat-scene.png',
      ctaPrimary: { text: 'TACTICAL GUIDES', href: '/guides', variant: 'red' },
      ctaSecondary: { text: 'LATEST INTEL', href: '/news', variant: 'alt' },
      ctaTertiary: { text: 'PLAY FOR FREE', href: '#download', variant: 'primary' },
      particleColor: 'red',
    },
    {
      id: 2,
      badge: 'UNREAL ENGINE 5 VOXEL REALISM',
      badgeColor: 'green',
      titlePrimary: 'THE EPIC SCALE',
      titleSecondary: 'VOXEL RTS EXPERIENCE',
      subtitle: 'Every laser trajectory, ballistic cannon, and seismic detonation physically reshapes the planetary surface in real-time. No two battlefields ever play the same.',
      bgImage: '/crafting-base.jpg',
      ctaPrimary: { text: 'WATCH 4K TRAILER', action: 'video', variant: 'cyan' },
      ctaSecondary: { text: 'COMMAND GRID 2.0', href: '/game#commands', variant: 'alt' },
      ctaTertiary: { text: 'PLAY FOR FREE', href: '#download', variant: 'primary' },
      particleColor: 'green',
    },
  ];

  // Auto-advance slides with smooth progress timer
  useEffect(() => {
    const slideDuration = 8000;
    const intervalTime = 50;
    const step = (intervalTime / slideDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  const handleSelectSlide = (index) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const active = slides[currentSlide];

  return (
    <>
      <section
        style={{
          position: 'relative',
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          background: '#06070a',
        }}
      >
        {/* Particle Canvas Layer */}
        <ParticleField count={70} color={active.particleColor} />

        {/* Scanline atmospheric grid overlay */}
        <div className="scanline-overlay" />

        {/* Dynamic Background Image Layers with Smooth Crossfade */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: idx === currentSlide ? 1 : 0,
              transform: idx === currentSlide ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 1.2s ease-in-out, transform 8s ease-out',
              zIndex: 0,
            }}
          >
            <img
              src={s.bgImage}
              alt={s.titlePrimary}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                filter: 'brightness(0.38) contrast(1.15)',
              }}
            />
            {/* Vignette Gradients */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 60% 50%, rgba(6, 7, 10, 0.2) 0%, rgba(6, 7, 10, 0.85) 75%, #060709 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '240px',
                background: 'linear-gradient(to top, #0a0d12 0%, transparent 100%)',
              }}
            />
          </div>
        ))}

        {/* Main Hero Content */}
        <div
          className="container-full"
          style={{
            position: 'relative',
            zIndex: 10,
            paddingTop: '6rem',
            paddingBottom: '5rem',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ maxWidth: '850px' }}>
            {/* Faction / Section Badge */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                className={`hud-badge ${
                  active.badgeColor === 'red'
                    ? 'hud-badge-red'
                    : active.badgeColor === 'green'
                    ? 'hud-badge-green'
                    : 'hud-badge-cyan'
                }`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              >
                <span className="radar-ping" style={{ width: '6px', height: '6px' }} />
                {active.badge}
              </span>
            </div>

            {/* Monumental Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.8rem)',
                fontWeight: 900,
                lineHeight: 1.05,
                marginBottom: '1.25rem',
                textShadow: '0 4px 30px rgba(0,0,0,0.9)',
                letterSpacing: '0.02em',
              }}
            >
              <span style={{ color: '#ffffff' }}>{active.titlePrimary}</span>{' '}
              <span
                style={{
                  color:
                    active.particleColor === 'red'
                      ? 'var(--cortex-red)'
                      : active.particleColor === 'green'
                      ? 'var(--legion-acid)'
                      : 'var(--armada-cyan)',
                  textShadow:
                    active.particleColor === 'red'
                      ? '0 0 35px rgba(255, 51, 68, 0.6)'
                      : active.particleColor === 'green'
                      ? '0 0 35px rgba(0, 255, 136, 0.6)'
                      : '0 0 35px rgba(0, 240, 255, 0.6)',
                }}
              >
                {active.titleSecondary}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
                color: 'var(--text-dim)',
                lineHeight: 1.6,
                maxWidth: '720px',
                marginBottom: '2.5rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {active.subtitle}
            </p>

            {/* CTA Buttons Row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              {active.ctaPrimary.action === 'video' ? (
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="btn-tech btn-tech-primary btn-tech-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {active.ctaPrimary.text}
                </button>
              ) : (
                <Link
                  href={active.ctaPrimary.href}
                  className={`btn-tech btn-tech-lg ${
                    active.ctaPrimary.variant === 'red'
                      ? 'btn-tech-red'
                      : 'btn-tech-outline-cyan'
                  }`}
                >
                  {active.ctaPrimary.text}
                </Link>
              )}

              {active.ctaSecondary && (
                <Link
                  href={active.ctaSecondary.href}
                  className={`btn-tech btn-tech-lg ${
                    active.ctaSecondary.variant === 'primary'
                      ? 'btn-tech-primary'
                      : 'btn-tech-alt'
                  }`}
                >
                  {active.ctaSecondary.text}
                </Link>
              )}

              {active.ctaTertiary && (
                <Link
                  href={active.ctaTertiary.href}
                  className="btn-tech btn-tech-primary btn-tech-lg"
                >
                  {active.ctaTertiary.text}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Slide Controls & Progress Navigation (BAR Style) */}
        <div
          className="container-full"
          style={{
            position: 'relative',
            zIndex: 10,
            paddingBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Slide Indicator Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleSelectSlide(idx)}
                style={{
                  position: 'relative',
                  width: idx === currentSlide ? '120px' : '45px',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  clipPath: 'var(--chamfer-sm)',
                  transition: 'all 0.4s var(--ease-smooth)',
                  overflow: 'hidden',
                }}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {idx === currentSlide && (
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background:
                        s.particleColor === 'red'
                          ? 'var(--cortex-red)'
                          : s.particleColor === 'green'
                          ? 'var(--legion-acid)'
                          : 'var(--armada-cyan)',
                      boxShadow: '0 0 10px rgba(0, 240, 255, 0.8)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Slide Counter & Next/Prev Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
              }}
            >
              <strong style={{ color: '#fff' }}>0{currentSlide + 1}</strong> / 0{slides.length}
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handlePrev}
                aria-label="Previous slide"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(16, 20, 29, 0.8)',
                  border: '1px solid var(--border-dim)',
                  clipPath: 'var(--chamfer-sm)',
                  color: '#fff',
                  transition: 'all 0.2s',
                }}
                className="hover-cyan"
              >
                ◀
              </button>
              <button
                onClick={handleNext}
                aria-label="Next slide"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(16, 20, 29, 0.8)',
                  border: '1px solid var(--border-dim)',
                  clipPath: 'var(--chamfer-sm)',
                  color: '#fff',
                  transition: 'all 0.2s',
                }}
                className="hover-cyan"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Angular Crumble SVG Divider */}
        <CrumbleDivider position="bottom" fill="#0a0d12" bg="transparent" />
      </section>

      {/* 4K Cinematic Trailer Video Modal */}
      {videoModalOpen && (
        <div
          onClick={() => setVideoModalOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(4, 5, 8, 0.94)',
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
              width: '100%',
              maxWidth: '1020px',
              aspectRatio: '16/9',
              background: '#000',
              border: '2px solid var(--armada-cyan)',
              boxShadow: '0 0 50px rgba(0, 240, 255, 0.4)',
              clipPath: 'var(--chamfer-md)',
            }}
          >
            <button
              onClick={() => setVideoModalOpen(false)}
              aria-label="Close trailer video"
              style={{
                position: 'absolute',
                top: '-45px',
                right: 0,
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                letterSpacing: '0.1em',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '0.4rem 0.9rem',
                clipPath: 'var(--chamfer-sm)',
              }}
            >
              [CLOSE ✕]
            </button>
            <iframe
              src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="NextGenGames Official Cinematic Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
