'use client';

import { useState, useEffect } from 'react';
import ParticleField from '@/components/ParticleField';
import './coming-soon.css';

export default function ComingSoonPage() {
  // Countdown Timer Target: e.g. Q4 2026 Alpha Reveal
  const [timeLeft, setTimeLeft] = useState({
    days: 42,
    hours: 18,
    minutes: 34,
    seconds: 59,
  });

  const [email, setEmail] = useState('');
  const [clearanceCode, setClearanceCode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize and tick countdown
  useEffect(() => {
    // Check if user already registered previously
    try {
      const savedCode = localStorage.getItem('ngg_alpha_callsign');
      if (savedCode) {
        setClearanceCode(savedCode);
      }
    } catch (e) {
      // LocalStorage not available or blocked
    }

    // Target Alpha Date: 118 days from now
    const targetDate = new Date(Date.now() + (118 * 24 + 14) * 3600 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const randomCallsign = `NGG-${Math.floor(1000 + Math.random() * 9000)}-${email.slice(0, 3).toUpperCase()}`;
      setClearanceCode(randomCallsign);
      try {
        localStorage.setItem('ngg_alpha_callsign', randomCallsign);
        localStorage.setItem('ngg_alpha_email', email);
      } catch (err) {
        // Ignore storage errors
      }
      setIsSubmitting(false);
    }, 700);
  };

  const handleCopyCode = () => {
    if (!clearanceCode) return;
    navigator.clipboard.writeText(clearanceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cs-viewport">
      {/* 1. Atmospheric Sci-Fi Backdrop & Particles */}
      <div className="cs-backdrop">
        <div className="cs-backdrop-img" />
        <div className="cs-backdrop-overlay" />
        <div className="cs-scanlines" />
        <div className="cs-vignette" />
        <div className="cs-grid-floor" />
      </div>

      <ParticleField count={70} color="cyan" />

      {/* 2. Sleek High-Tech Header */}
      <header className="cs-header">
        <div className="cs-brand-group">
          {/* Glowing NextGenGames Studio Mark */}
          <svg className="cs-brand-emblem" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,6 94,50 50,94 6,50" stroke="#00f0ff" strokeWidth="4" fill="#06090f" />
            <polygon points="50,18 82,50 50,82 18,50" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
            <polygon points="50,30 70,50 50,70 30,50" fill="#00f0ff" />
            <circle cx="50" cy="50" r="5" fill="#ffffff" />
          </svg>
          <div className="cs-brand-text">
            <span className="cs-brand-main">NEXTGEN GAMES</span>
            <span className="cs-brand-sub">TACTICAL VOXEL SANDBOX</span>
          </div>
        </div>

        <div className="cs-header-center">
          <span className="radar-ping" />
          <span>ALPHA DEV ACTIVE // UNREAL ENGINE 5.5</span>
        </div>

        <div className="cs-header-actions">
          <a
            href="https://store.steampowered.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cs-social-pill"
            title="Wishlist on Steam"
          >
            <img src="/icons/platform-steam.svg" alt="Steam" className="cs-social-icon" />
            <span>STEAM</span>
          </a>
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="cs-social-pill"
            title="Join Official Discord"
          >
            <img src="/icons/icon-discord.svg" alt="Discord" className="cs-social-icon" />
            <span>DISCORD</span>
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cs-social-pill"
            title="Follow on X"
          >
            <img src="/icons/icon-twitter.svg" alt="X / Twitter" className="cs-social-icon" />
            <span>X</span>
          </a>
        </div>
      </header>

      {/* 3. Main Centerpiece Body */}
      <main className="cs-main">
        {/* Intel Directive Pill */}
        <div className="cs-intel-pill">
          <span>// CLASSIFIED TRANSMISSION</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
          <span>SECTOR 151 INITIALIZATION</span>
        </div>

        {/* Hero Title */}
        <h1 className="cs-hero-title">
          THE NEXT GENERATION <br />
          <span className="cs-glow-gradient">OF PLANETARY WARFARE</span> <br />
          IS COMING.
        </h1>

        {/* Hero Narrative Subtitle */}
        <p className="cs-hero-desc">
          We are architecting an epic-scale tactical sci-fi sandbox built on Unreal Engine 5. 
          Massive procedural worlds, real-time voxel physics, and uncompromised immersion. 
          The public portal is currently restricted as closed testing approaches.
        </p>

        {/* HUD Countdown & Telemetry Box */}
        <div className="cs-hud-box">
          <div className="cs-hud-header">
            <div className="cs-hud-label">
              <span className="radar-ping" />
              <span>ESTIMATED ALPHA TRANSMISSION WINDOW</span>
            </div>
            <div className="cs-hud-clock-ticker">
              UTC // SYNCED
            </div>
          </div>

          <div className="cs-countdown-grid">
            <div className="cs-countdown-tile">
              <span className="cs-countdown-num">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="cs-countdown-unit">DAYS</span>
            </div>
            <div className="cs-countdown-tile">
              <span className="cs-countdown-num">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="cs-countdown-unit">HOURS</span>
            </div>
            <div className="cs-countdown-tile">
              <span className="cs-countdown-num">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="cs-countdown-unit">MINUTES</span>
            </div>
            <div className="cs-countdown-tile">
              <span className="cs-countdown-num">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="cs-countdown-unit">SECONDS</span>
            </div>
          </div>

          <div className="cs-telemetry-row">
            <div className="cs-telemetry-item">
              <span className="cs-telemetry-key">DEVELOPMENT PHASE</span>
              <span className="cs-telemetry-val">01 / CLOSED ALPHA PREP</span>
            </div>
            <div className="cs-telemetry-item">
              <span className="cs-telemetry-key">PHYSICS ENGINE</span>
              <span className="cs-telemetry-val">UE5.5 CHAOS &amp; VOXEL</span>
            </div>
            <div className="cs-telemetry-item">
              <span className="cs-telemetry-key">SIMULATION NETCODE</span>
              <span className="cs-telemetry-val">128 HZ DETERMINISTIC</span>
            </div>
            <div className="cs-telemetry-item">
              <span className="cs-telemetry-key">ACCESS CLEARANCE</span>
              <span className="cs-telemetry-val" style={{ color: 'var(--legion-acid)' }}>WHITELIST OPEN</span>
            </div>
          </div>
        </div>

        {/* Early Access Alpha Whitelist Terminal */}
        <div className="cs-whitelist-section">
          {!clearanceCode ? (
            <div>
              <h2 className="cs-form-title">REQUEST CLOSED ALPHA CLEARANCE</h2>
              <p className="cs-form-desc">
                Enter your frequency to secure priority test deployment, exclusive Founder status, and closed Steam playtest keys.
              </p>
              <form onSubmit={handleRegister} className="cs-form-wrap">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="OPERATOR_COMM@NETWORK.COM"
                  className="cs-input-field"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cs-btn-submit"
                >
                  {isSubmitting ? 'ENCRYPTING...' : 'REQUEST ACCESS →'}
                </button>
              </form>
            </div>
          ) : (
            <div className="cs-success-card">
              <div className="cs-success-badge">
                <span className="radar-ping" />
                <span>CLEARANCE CONFIRMED // OPERATOR ENROLLED</span>
              </div>
              <h3 className="cs-success-title">YOU ARE ON THE ALPHA ROSTER</h3>
              <p className="cs-success-desc">
                Your transmission frequency has been logged into the secure telemetry database. 
                You will receive playtest keys and confidential devlogs before anyone else.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="cs-callsign-pill">
                  <span>CALLSIGN:</span>
                  <strong style={{ color: '#ffffff' }}>{clearanceCode}</strong>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="btn-tech btn-tech-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.75rem' }}
                >
                  {copied ? '✓ COPIED' : 'COPY CALLSIGN'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Core Pillars / Intel Highlights */}
        <div className="cs-pillars-grid">
          <div className="cs-pillar-card">
            <div className="cs-pillar-num">// PROTOCOL 01</div>
            <h3 className="cs-pillar-title">VOXEL PLANETARY SCALE</h3>
            <p className="cs-pillar-desc">
              Entire planets modeled with full volumetric deformation. Blast craters, burrow tunnels, and collapse terrain with real-time ballistic projectile simulation.
            </p>
          </div>

          <div className="cs-pillar-card">
            <div className="cs-pillar-num">// PROTOCOL 02</div>
            <h3 className="cs-pillar-title">UNIFIED COMMAND SYSTEM</h3>
            <p className="cs-pillar-desc">
              Fight on the boots-on-the-ground front lines with tactical gunplay or zoom out seamlessly to order autonomous robotic Vassals and planetary bombardment strikes.
            </p>
          </div>

          <div className="cs-pillar-card">
            <div className="cs-pillar-num">// PROTOCOL 03</div>
            <h3 className="cs-pillar-title">STEAM EXCLUSIVE ALPHA</h3>
            <p className="cs-pillar-desc">
              Built natively for modern PC hardware. Zero pay-to-win, direct Steam community integration, and community-driven server orchestration.
            </p>
          </div>
        </div>

        {/* Primary Community Dispatch Bar */}
        <div className="cs-dispatch-hub">
          <span className="cs-dispatch-title">
            JOIN THE COMMUNITY &amp; TRACK DEVELOPMENT
          </span>
          <div className="cs-dispatch-buttons">
            <a
              href="https://store.steampowered.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-dispatch-btn cs-dispatch-btn-primary"
            >
              <img src="/icons/platform-steam.svg" alt="Steam" style={{ width: 18, height: 18 }} />
              <span>WISHLIST ON STEAM</span>
            </a>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-dispatch-btn"
            >
              <img src="/icons/icon-discord.svg" alt="Discord" style={{ width: 18, height: 18 }} />
              <span>JOIN DISCORD HQ</span>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-dispatch-btn"
            >
              <img src="/icons/icon-youtube.svg" alt="YouTube" style={{ width: 18, height: 18 }} />
              <span>DEVLOG EPISODES</span>
            </a>
          </div>
        </div>
      </main>

      {/* 4. Minimal Studio Footer */}
      <footer className="cs-footer">
        <div className="cs-footer-meta">
          © {new Date().getFullYear()} NextGenGames.gg. All rights reserved. Built with Unreal Engine 5.
        </div>

        <div className="cs-audio-wave">
          <span>SIGNAL: 104.8 MHz</span>
          <div className="cs-wave-bars">
            <span className="cs-wave-bar" />
            <span className="cs-wave-bar" />
            <span className="cs-wave-bar" />
            <span className="cs-wave-bar" />
            <span className="cs-wave-bar" />
          </div>
          <span style={{ color: 'var(--legion-acid)', fontWeight: 700 }}>LIVE</span>
        </div>
      </footer>
    </div>
  );
}
