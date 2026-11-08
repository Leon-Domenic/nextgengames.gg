'use client';

import { useState, useEffect } from 'react';

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const reviews = [
    {
      author: 'Evan Lahti',
      outlet: 'PC Gamer',
      quote:
        'The real-time voxel collision mechanics and modular planetary engineering are an absolute triumph. Nothing else touches this scale.',
      icon: '🎮',
      source: 'Press Review',
    },
    {
      author: 'Day9TV',
      outlet: 'Content Creator',
      quote:
        'The games are wild. Thousands of simulated autonomous units on screen across an entire planetoid... it is truly incredible!',
      icon: '📺',
      source: 'YouTube / Twitch',
    },
    {
      author: 'Patricia Hernandez',
      outlet: 'Kotaku',
      quote:
        'Damn. NextGenGames was not on our radar before this Alpha playtest — but it sure as hell is now.',
      icon: '📰',
      source: 'Press Review',
    },
    {
      author: 'G. Clay Whittaker',
      outlet: 'Popular Science',
      quote:
        'NextGenGames could leave conventional extraction survival and strategy games in the dimensional dust.',
      icon: '🔬',
      source: 'Popular Science Tech',
    },
    {
      author: 'Chris Taylor',
      outlet: 'Industry Pioneer',
      quote:
        'I cannot believe what you have built here... the procedural voxel simulation and scale is truly a wonder. Blown away!',
      icon: '⭐',
      source: 'Industry Legend',
    },
    {
      author: 'uThermal',
      outlet: 'Pro RTS Player',
      quote:
        'Project X is the best strategic voxel expedition game I have played in years. The responsiveness is unmatched.',
      icon: '🏆',
      source: 'Competitive Circuit',
    },
  ];

  // Auto-cycle every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <section
      style={{
        background: '#060709',
        padding: '5rem 0',
        position: 'relative',
        zIndex: 5,
        overflow: 'hidden',
      }}
      id="testimonials"
    >
      <div className="container-full">
        {/* Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-subtitle">GLOBAL ACCLAIM // CRITIC &amp; COMMUNITY RECEPTION</div>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 3.2vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '0.02em',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            &ldquo;A new era of{' '}
            <span style={{ color: 'var(--armada-cyan)' }}>epic planetary strategy</span> and{' '}
            <span style={{ color: 'var(--cortex-red)' }}>voxel survival</span> has begun&rdquo;
          </h2>
        </div>

        {/* Testimonials Grid / Swiper */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {reviews.map((r, i) => (
            <div
              key={i}
              className="hud-frame"
              style={{
                background: 'rgba(16, 20, 29, 0.65)',
                backdropFilter: 'blur(8px)',
                borderColor: i === activeIndex ? 'var(--armada-cyan)' : 'var(--border-dim)',
                transform: i === activeIndex ? 'translateY(-4px)' : 'none',
                transition: 'all 0.3s var(--ease-smooth)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  color: 'var(--text-main)',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                }}
              >
                &ldquo;{r.quote}&rdquo;
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-dim)',
                  paddingTop: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#fff',
                    }}
                  >
                    {r.author}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--armada-cyan)',
                    }}
                  >
                    {r.outlet}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>{r.icon}</span>
                  <span>{r.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
