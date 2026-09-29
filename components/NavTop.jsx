'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavTop() {
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setPinned(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setSearchOpen(false);
  }, [pathname]);

  const handleDropdownEnter = (menu) => {
    setActiveDropdown(menu);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <>
      {/* Top Utility Bar (BAR-style Pre-header) */}
      <div
        style={{
          background: '#040608',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          position: 'relative',
          zIndex: 102,
        }}
      >
        <div
          className="container-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '32px',
          }}
        >
          {/* Status & Live Expeditions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="radar-ping" />
              <span style={{ color: 'var(--legion-acid)', fontWeight: 700 }}>ALPHA v0.9.4 LIVE</span>
            </div>
            <div style={{ display: 'none', md: 'flex', alignItems: 'center', gap: '0.35rem' }} className="hide-mobile">
              <span style={{ color: 'var(--text-dim)' }}>EXPEDITIONS:</span>
              <span style={{ color: 'var(--armada-cyan)' }}>142 ACTIVE</span>
            </div>
          </div>

          {/* Quick utility links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link
              href="/replays"
              style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}
              className="hover-cyan"
            >
              REPLAYS
            </Link>
            <Link
              href="/leaderboard"
              style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}
              className="hover-cyan"
            >
              LEADERBOARD
            </Link>
            <Link
              href="/news"
              style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}
              className="hover-cyan"
            >
              DEVLOG
            </Link>
            <Link
              href="/store"
              style={{
                color: 'var(--cortex-orange)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              ★ FOUNDER PORTAL
            </Link>
          </div>
        </div>
      </div>

      {/* Main Primary Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: pinned
            ? 'rgba(7, 9, 13, 0.94)'
            : 'rgba(10, 13, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: pinned
            ? '1px solid rgba(0, 240, 255, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: pinned ? '0 10px 30px rgba(0, 0, 0, 0.7)' : 'none',
          transition: 'all 0.3s var(--ease-smooth)',
        }}
      >
        <div
          className="container-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                clipPath: 'var(--chamfer-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px var(--armada-glow)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  color: '#000',
                  lineHeight: 1,
                }}
              >
                N
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  letterSpacing: '0.08em',
                  color: '#ffffff',
                  lineHeight: 1.1,
                }}
              >
                NEXTGEN<span style={{ color: 'var(--armada-cyan)' }}>GAMES</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.18em',
                  color: 'var(--text-muted)',
                }}
              >
                PROJECT X : SECTOR 4
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            className="desktop-nav"
          >
            {/* HOME */}
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '0.5rem 0.9rem',
                color: pathname === '/' ? 'var(--armada-cyan)' : 'var(--text-main)',
                borderBottom: pathname === '/' ? '2px solid var(--armada-cyan)' : '2px solid transparent',
              }}
            >
              HOME
            </Link>

            {/* INFORMATION DROPDOWN */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleDropdownEnter('info')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '0.5rem 0.9rem',
                  color: activeDropdown === 'info' ? 'var(--armada-cyan)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                INFORMATION
                <span style={{ fontSize: '0.65rem', transform: activeDropdown === 'info' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {activeDropdown === 'info' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '-40px',
                    width: '460px',
                    background: 'rgba(11, 15, 22, 0.96)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-cyan)',
                    clipPath: 'var(--chamfer-md)',
                    padding: '1.25rem',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px var(--armada-glow)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    zIndex: 101,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--armada-cyan)',
                        letterSpacing: '0.15em',
                        marginBottom: '0.6rem',
                        borderBottom: '1px solid var(--border-dim)',
                        paddingBottom: '0.3rem',
                      }}
                    >
                      // EXPLORATION &amp; LORE
                    </div>
                    <Link href="/news" className="dropdown-item">
                      <div className="dropdown-title">News &amp; Intel</div>
                      <div className="dropdown-desc">Latest dev notes and transmissions</div>
                    </Link>
                    <Link href="/lore" className="dropdown-item">
                      <div className="dropdown-title">Universe Lore</div>
                      <div className="dropdown-desc">Beyond Human Reach chronicle</div>
                    </Link>
                    <Link href="/guides" className="dropdown-item">
                      <div className="dropdown-title">Field Guides</div>
                      <div className="dropdown-desc">Base building &amp; automation</div>
                    </Link>
                    <Link href="/game#commands" className="dropdown-item">
                      <div className="dropdown-title">Command Grid 2.0</div>
                      <div className="dropdown-desc">Tactical shortcuts and macro queues</div>
                    </Link>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--armada-cyan)',
                        letterSpacing: '0.15em',
                        marginBottom: '0.6rem',
                        borderBottom: '1px solid var(--border-dim)',
                        paddingBottom: '0.3rem',
                      }}
                    >
                      // TECHNICAL &amp; MEDIA
                    </div>
                    <Link href="/maps" className="dropdown-item">
                      <div className="dropdown-title">Star Charts &amp; Maps</div>
                      <div className="dropdown-desc">Planetary biomes and hazard zones</div>
                    </Link>
                    <Link href="/game#screenshots" className="dropdown-item">
                      <div className="dropdown-title">4K Media Vault</div>
                      <div className="dropdown-desc">In-game captures &amp; wallpapers</div>
                    </Link>
                    <Link href="/game" className="dropdown-item">
                      <div className="dropdown-title">Gameplay Systems</div>
                      <div className="dropdown-desc">Real-time voxel engine overview</div>
                    </Link>
                    <Link href="/game#faq" className="dropdown-item">
                      <div className="dropdown-title">FAQ &amp; Code of Conduct</div>
                      <div className="dropdown-desc">Fair play &amp; hardware specs</div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* UNITS & FACTIONS DROPDOWN */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleDropdownEnter('units')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '0.5rem 0.9rem',
                  color: activeDropdown === 'units' ? 'var(--armada-cyan)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                UNITS &amp; TECH
                <span style={{ fontSize: '0.65rem', transform: activeDropdown === 'units' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {activeDropdown === 'units' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '-120px',
                    width: '580px',
                    background: 'rgba(11, 15, 22, 0.96)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    clipPath: 'var(--chamfer-md)',
                    padding: '1.25rem',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.2)',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    gap: '1.25rem',
                    zIndex: 101,
                  }}
                >
                  {/* ARMADA VANGUARD */}
                  <div style={{ borderRight: '1px solid var(--border-dim)', paddingRight: '0.75rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--armada-cyan)', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                      [FACTION 01]
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#ffffff', fontWeight: 800 }}>
                      ARMADA VANGUARD
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      Aerospace dominance, precision railguns &amp; terraforming rigs.
                    </p>
                    <Link href="/game#armada" className="dropdown-link-sub cyan">Overview &amp; Tech Tree →</Link>
                    <Link href="/game#counters" className="dropdown-link-sub cyan">Counters Matrix →</Link>
                  </div>

                  {/* CORTEX SYNDICATE */}
                  <div style={{ borderRight: '1px solid var(--border-dim)', paddingRight: '0.75rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cortex-red)', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                      [FACTION 02]
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#ffffff', fontWeight: 800 }}>
                      CORTEX SYNDICATE
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      Heavy mechanoids, incendiary swarms &amp; armored crawlers.
                    </p>
                    <Link href="/game#cortex" className="dropdown-link-sub red">Overview &amp; Tech Tree →</Link>
                    <Link href="/game#counters" className="dropdown-link-sub red">Counters Matrix →</Link>
                  </div>

                  {/* AETHERION VOIDFARERS */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--legion-acid)', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                      [FACTION 03]
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#ffffff', fontWeight: 800 }}>
                      AETHERION
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      Phase rift tech, quantum shields &amp; stealth extractors.
                    </p>
                    <Link href="/game#aetherion" className="dropdown-link-sub green">Overview &amp; Tech Tree →</Link>
                    <Link href="/game#compare" className="dropdown-link-sub green">Compare All Factions →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* DEVELOPMENT DROPDOWN */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleDropdownEnter('dev')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '0.5rem 0.9rem',
                  color: activeDropdown === 'dev' ? 'var(--armada-cyan)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                DEVELOPMENT
                <span style={{ fontSize: '0.65rem', transform: activeDropdown === 'dev' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {activeDropdown === 'dev' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '260px',
                    background: 'rgba(11, 15, 22, 0.96)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-cyan)',
                    clipPath: 'var(--chamfer-sm)',
                    padding: '0.85rem',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8)',
                    zIndex: 101,
                  }}
                >
                  <Link href="/news" className="dropdown-item">
                    <div className="dropdown-title">Dev Diaries</div>
                    <div className="dropdown-desc">Voxel physics &amp; engine blogs</div>
                  </Link>
                  <Link href="/news?cat=Patch+Notes" className="dropdown-item">
                    <div className="dropdown-title">Changelog &amp; Balance</div>
                    <div className="dropdown-desc">Alpha patch notes and telemetry</div>
                  </Link>
                  <Link href="/game#roadmap" className="dropdown-item">
                    <div className="dropdown-title">Steam Release Roadmap</div>
                    <div className="dropdown-desc">Milestones through 2026-2027</div>
                  </Link>
                  <Link href="/game#team" className="dropdown-item">
                    <div className="dropdown-title">Studio Team &amp; Jobs</div>
                    <div className="dropdown-desc">Join NextGenGames studio</div>
                  </Link>
                </div>
              )}
            </div>

            {/* MERCH & FOUNDER STORE */}
            <Link
              href="/store"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '0.5rem 0.9rem',
                color: pathname === '/store' ? 'var(--armada-cyan)' : 'var(--text-main)',
                borderBottom: pathname === '/store' ? '2px solid var(--armada-cyan)' : '2px solid transparent',
              }}
            >
              STORE
            </Link>
          </nav>

          {/* Right Action Icons & CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Toggle site search"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-dim)',
                clipPath: 'var(--chamfer-sm)',
                transition: 'all 0.2s',
              }}
              className="hover-cyan"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Social Icons (Discord, Steam, YouTube, Twitch) */}
            <div style={{ display: 'none', alignItems: 'center', gap: '0.4rem' }} className="desktop-socials">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                title="Join NextGenGames Discord"
                className="social-icon-btn"
              >
                <img src="/icons/icon-discord.svg" alt="Discord" width="16" height="16" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                title="NextGenGames YouTube"
                className="social-icon-btn"
              >
                <img src="/icons/icon-youtube.svg" alt="YouTube" width="16" height="16" />
              </a>
              <a
                href="https://store.steampowered.com"
                target="_blank"
                rel="noreferrer"
                title="Wishlist on Steam"
                className="social-icon-btn"
              >
                <img src="/icons/platform-steam.svg" alt="Steam" width="16" height="16" />
              </a>
            </div>

            {/* Prominent Glowing PLAY CTA Button (BAR Signature) */}
            <Link
              href="/#download"
              className="btn-tech btn-tech-primary btn-tech-sm"
              style={{
                fontWeight: 900,
                letterSpacing: '0.12em',
                padding: '0.65rem 1.4rem',
              }}
            >
              <span className="radar-ping" style={{ width: '6px', height: '6px' }} />
              PLAY ALPHA
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-toggle"
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                width: '40px',
                height: '40px',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-dim)',
                clipPath: 'var(--chamfer-sm)',
              }}
            >
              <span style={{ width: '20px', height: '2px', background: '#fff', transition: '0.2s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ width: '20px', height: '2px', background: '#fff', opacity: mobileOpen ? 0 : 1, transition: '0.2s' }} />
              <span style={{ width: '20px', height: '2px', background: '#fff', transition: '0.2s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown Drawer */}
        {searchOpen && (
          <div
            style={{
              background: '#0a0d14',
              borderTop: '1px solid var(--border-dim)',
              borderBottom: '2px solid var(--armada-cyan)',
              padding: '1rem 0',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div className="container-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/news?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  maxWidth: '750px',
                  margin: '0 auto',
                }}
              >
                <input
                  type="text"
                  placeholder="Search units, tech trees, lore entries, maps, commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'rgba(16, 20, 29, 0.9)',
                    border: '1px solid var(--border-cyan)',
                    padding: '0.75rem 1.25rem',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    clipPath: 'var(--chamfer-sm)',
                  }}
                />
                <button type="submit" className="btn-tech btn-tech-primary btn-tech-sm">
                  SEARCH
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    padding: '0.5rem',
                  }}
                >
                  [ESC]
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div
            style={{
              background: 'rgba(6, 8, 12, 0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '2px solid var(--armada-cyan)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              HOME
            </Link>
            <Link href="/news" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              NEWS &amp; TRANSMISSIONS
            </Link>
            <Link href="/lore" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              UNIVERSE LORE
            </Link>
            <Link href="/guides" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              TACTICAL GUIDES &amp; CODEX
            </Link>
            <Link href="/maps" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              STAR CHARTS &amp; MAPS
            </Link>
            <Link href="/game" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff' }}>
              FACTIONS &amp; UNITS
            </Link>
            <Link href="/store" onClick={() => setMobileOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--cortex-orange)' }}>
              FOUNDER STORE &amp; MERCH
            </Link>
            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Link href="/#download" onClick={() => setMobileOpen(false)} className="btn-tech btn-tech-primary btn-tech-sm" style={{ width: '100%' }}>
                PLAY ALPHA FOR FREE
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Embedded Navigation Styles */}
      <style jsx>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-socials {
            display: flex !important;
          }
        }
        @media (max-width: 899px) {
          .mobile-toggle {
            display: flex !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
        .dropdown-item {
          display: block;
          padding: 0.5rem 0.6rem;
          border-radius: 2px;
          transition: background 0.2s;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .dropdown-title {
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 700;
          color: #ffffff;
        }
        .dropdown-desc {
          font-size: 0.72rem;
          color: var(--text-dim);
          line-height: 1.3;
        }
        .dropdown-link-sub {
          display: block;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          padding: 0.25rem 0;
          transition: color 0.2s;
        }
        .dropdown-link-sub.cyan {
          color: var(--armada-cyan);
        }
        .dropdown-link-sub.red {
          color: var(--cortex-red);
        }
        .dropdown-link-sub.green {
          color: var(--legion-acid);
        }
        .dropdown-link-sub:hover {
          text-decoration: underline;
        }
        .social-icon-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-dim);
          clip-path: var(--chamfer-sm);
          transition: all 0.2s;
        }
        .social-icon-btn:hover {
          background: rgba(0, 240, 255, 0.1);
          border-color: var(--armada-cyan);
          transform: translateY(-2px);
        }
        .hover-cyan:hover {
          color: var(--armada-cyan) !important;
          border-color: var(--armada-cyan) !important;
        }
      `}</style>
    </>
  );
}
