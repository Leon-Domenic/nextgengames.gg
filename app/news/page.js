'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from '@/components/CrumbleDivider';
import ParticleField from '@/components/ParticleField';

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Announcements', 'Dev Diaries', 'Patch Notes', 'Events'];

  const articles = [
    {
      id: 'news-1',
      title: 'Dev Diary #15: Terraforming Voxel Physics & Multithreaded Compute Shaders in UE5',
      category: 'Dev Diaries',
      date: 'September 24, 2026',
      excerpt:
        'A comprehensive deep dive into how our engineering team achieved real-time 60fps subterranean digging and physics displacement across 16-player multiplayer sessions.',
      img: '/screenshots/shot7.jpg',
      author: 'Lead Engine Architect',
      readTime: '7 min read',
    },
    {
      id: 'news-2',
      title: 'NextGenGames and Hooded Horse Announce Strategic Publishing Partnership',
      category: 'Announcements',
      date: 'September 18, 2026',
      excerpt:
        'We are thrilled to join forces with strategy titan Hooded Horse to expand NextGenGames to global audiences with enhanced server capacity and localized telemetry.',
      img: '/combat-scene.png',
      author: 'Studio Directors',
      readTime: '4 min read',
    },
    {
      id: 'news-3',
      title: 'Alpha Patch 0.9.4: Orbital Artillery Recalibration & Netcode Sync',
      category: 'Patch Notes',
      date: 'September 10, 2026',
      excerpt:
        'Recalibrated ballistic trajectories for heavy railgun batteries. Client-server desync decreased by 42% on high-latency trans-oceanic routes.',
      img: '/screenshots/shot8.jpg',
      author: 'Systems Lead',
      readTime: '5 min read',
    },
    {
      id: 'news-4',
      title: 'Founder Edition Pre-Orders Now Live on Steam & PlayStation Store',
      category: 'Announcements',
      date: 'August 24, 2026',
      excerpt:
        'Pre-order Project X to secure exclusive Pioneer spacesuits, permanent alpha leaderboard nameplates, and instant closed beta weekend access.',
      img: '/merch/founder-pack.png',
      author: 'Community Team',
      readTime: '3 min read',
    },
    {
      id: 'news-5',
      title: 'Modular Outpost Update: 40 New Connector Nodes & Solar Trackers',
      category: 'Patch Notes',
      date: 'August 12, 2026',
      excerpt:
        'Alpha Patch 0.8.4 introduces automated tracking solar gimbals, advanced conveyor logic gates, and magnetic docking ports for rovers.',
      img: '/crafting-base.jpg',
      author: 'Tools Team',
      readTime: '6 min read',
    },
    {
      id: 'news-6',
      title: 'Project X Hands-On Showcase at PAX East 2026: Recap & Highlights',
      category: 'Events',
      date: 'July 30, 2026',
      excerpt:
        'Over 4,000 pioneers stormed Booth #408 to experience our 4-player co-op planetary expedition demo. Check out photos, video recaps, and tournament winners.',
      img: '/screenshots/shot2.png',
      author: 'Event Coordinator',
      readTime: '5 min read',
    },
  ];

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
            TRANSMISSIONS // COMMUNICATIONS ARCHIVE
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            NEWS &amp; <span style={{ color: 'var(--armada-cyan)' }}>DEVELOPER LOGS</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Stay updated with developer diaries, patch notes, balance changes, and major studio announcements from the NextGenGames engineering team.
          </p>

          {/* Search & Category Filter Bar */}
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Search articles, patch notes, dev diaries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(16, 20, 29, 0.9)',
                  border: '1px solid var(--border-medium)',
                  padding: '0.85rem 1.25rem',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  clipPath: 'var(--chamfer-sm)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="btn-tech btn-tech-sm"
                  style={{
                    background: activeCategory === cat ? 'var(--armada-cyan)' : 'rgba(16, 20, 29, 0.8)',
                    color: activeCategory === cat ? '#000' : 'var(--text-dim)',
                    borderColor: activeCategory === cat ? 'var(--armada-cyan)' : 'var(--border-dim)',
                    fontWeight: 800,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CrumbleDivider position="bottom" fill="#0a0d14" bg="#06070a" />

      {/* Articles Grid */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-full">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2.5rem',
            }}
          >
            {filtered.map((article) => (
              <article
                key={article.id}
                className="hud-frame"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={article.img}
                    alt={article.title}
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
                      color: 'var(--armada-cyan)',
                      borderLeft: '2px solid var(--armada-cyan)',
                    }}
                  >
                    {article.category}
                  </div>
                </div>

                <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{article.date}</span>
                      <span>{article.readTime}</span>
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.25 }}>
                      {article.title}
                    </h2>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {article.excerpt}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      By {article.author}
                    </span>
                    <button
                      onClick={() => alert(`Opening ${article.title}`)}
                      className="btn-tech btn-tech-sm btn-tech-outline-cyan"
                    >
                      READ TRANSMISSION →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
