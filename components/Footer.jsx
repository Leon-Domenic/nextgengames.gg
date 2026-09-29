'use client';

import { useState } from 'react';
import Link from 'next/link';
import CrumbleDivider from './CrumbleDivider';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <footer
      style={{
        background: '#040507',
        color: 'var(--text-main)',
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <CrumbleDivider position="top" fill="#040507" bg="#0a0d14" />

      {/* Main Footer Directory */}
      <div className="container-full" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            marginBottom: '4rem',
          }}
        >
          {/* Brand & Mission Column */}
          <div style={{ gridColumn: 'span 2' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                  clipPath: 'var(--chamfer-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px var(--armada-glow)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: '#000' }}>
                  N
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.08em', color: '#fff' }}>
                NEXTGEN<span style={{ color: 'var(--armada-cyan)' }}>GAMES</span>
              </span>
            </Link>

            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '380px', marginBottom: '1.5rem' }}>
              NextGenGames is an independent gaming studio dedicated to pushing the boundaries of real-time voxel physics, planetary scale multiplayer, and tactical autonomy.
            </p>

            {/* Newsletter Subscription */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--armada-cyan)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                // TRANSMISSION SUBSCRIPTION
              </div>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', maxWidth: '380px' }}>
                <input
                  type="email"
                  placeholder="Enter pioneer email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    background: 'rgba(16, 20, 29, 0.9)',
                    border: '1px solid var(--border-medium)',
                    padding: '0.6rem 0.9rem',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    clipPath: 'var(--chamfer-sm)',
                  }}
                />
                <button type="submit" className="btn-tech btn-tech-primary btn-tech-sm">
                  {subscribed ? '✓ JOINED' : 'SUBSCRIBE'}
                </button>
              </form>
            </div>
          </div>

          {/* Directory Column 1: GAME */}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', letterSpacing: '0.06em' }}>
              GAMEPLAY
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              <li><Link href="/#download" className="hover-cyan">Play Alpha Free</Link></li>
              <li><Link href="/game" className="hover-cyan">Core Systems</Link></li>
              <li><Link href="/maps" className="hover-cyan">Star Charts &amp; Maps</Link></li>
              <li><Link href="/game#commands" className="hover-cyan">Command Grid 2.0</Link></li>
              <li><Link href="/replays" className="hover-cyan">Match Telemetry</Link></li>
            </ul>
          </div>

          {/* Directory Column 2: FACTIONS & TECH */}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', letterSpacing: '0.06em' }}>
              FACTIONS &amp; TECH
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              <li><Link href="/game#armada" className="hover-cyan" style={{ color: 'var(--armada-cyan)' }}>Armada Vanguard</Link></li>
              <li><Link href="/game#cortex" className="hover-cyan" style={{ color: 'var(--cortex-red)' }}>Cortex Syndicate</Link></li>
              <li><Link href="/game#aetherion" className="hover-cyan" style={{ color: 'var(--legion-acid)' }}>Aetherion Void</Link></li>
              <li><Link href="/game#compare" className="hover-cyan">Unit Comparison Matrix</Link></li>
              <li><Link href="/guides" className="hover-cyan">Tactical Field Guides</Link></li>
            </ul>
          </div>

          {/* Directory Column 3: DEVELOPMENT & COMMUNITY */}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', letterSpacing: '0.06em' }}>
              STUDIO &amp; COMMUNITY
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              <li><Link href="/news" className="hover-cyan">Devlog &amp; Microblog</Link></li>
              <li><Link href="/lore" className="hover-cyan">Universe Lore</Link></li>
              <li><Link href="/game#roadmap" className="hover-cyan">Release Roadmap</Link></li>
              <li><Link href="/store" className="hover-cyan">Founder Store</Link></li>
              <li><a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover-cyan">Official Discord (52k+)</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © 2026 NEXTGENGAMES.GG — ALL RIGHTS RESERVED. POWERED BY UNREAL ENGINE 5 VOXEL SIMULATION.
          </div>

          {/* Social Icons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="social-icon-btn" title="Discord">
              <img src="/icons/icon-discord.svg" alt="Discord" width="16" height="16" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon-btn" title="YouTube">
              <img src="/icons/icon-youtube.svg" alt="YouTube" width="16" height="16" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon-btn" title="Twitter / X">
              <img src="/icons/icon-twitter.svg" alt="Twitter" width="16" height="16" />
            </a>
            <a href="https://reddit.com" target="_blank" rel="noreferrer" className="social-icon-btn" title="Reddit">
              <img src="/icons/icon-reddit.svg" alt="Reddit" width="16" height="16" />
            </a>
            <a href="https://twitch.tv" target="_blank" rel="noreferrer" className="social-icon-btn" title="Twitch">
              <img src="/icons/icon-twitch.svg" alt="Twitch" width="16" height="16" />
            </a>
            <a href="https://store.steampowered.com" target="_blank" rel="noreferrer" className="social-icon-btn" title="Steam">
              <img src="/icons/platform-steam.svg" alt="Steam" width="16" height="16" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
