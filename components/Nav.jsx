'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const [pinned, setPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const threshold = isHome ? window.innerHeight - 80 : 360;
        setPinned(window.scrollY > threshold);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  return (
    <>
      <div id="splash-progress">
        <div className="loader-progress" />
      </div>

      <header className={`primary ${pinned ? 'pinned' : ''}`}>
        <nav id="main">
          <div className="in">
            <div className="mini-logo">
              <Link href="/">
                <span className="mini-logo-text">
                  PROJECT <span>X</span>
                </span>
              </Link>
            </div>

            <button
              className="mobile-nav-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              id="mobile-nav-toggle-btn"
            >
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>

            <ul className={`nav-list ${menuOpen ? 'open' : ''}`}>
              <li>
                <Link href="/game" onClick={() => setMenuOpen(false)}>
                  Game
                </Link>
              </li>
              <li>
                <Link href="/news" onClick={() => setMenuOpen(false)}>
                  News
                </Link>
              </li>
              <li>
                <Link href="/store" onClick={() => setMenuOpen(false)}>
                  Marketplace
                </Link>
              </li>
              <li className="emblem hide-1024">
                <Link href="/" aria-label="Project X Home">
                  <img
                    alt="Project X Emblem"
                    className="astroneer-emblem"
                    src="/brand/emblem.svg"
                  />
                </Link>
              </li>
              <li>
                <Link href="/game#mechanics" onClick={() => setMenuOpen(false)}>
                  Wiki
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                >
                  Discord
                </a>
              </li>
              <li>
                <Link href="/store" onClick={() => setMenuOpen(false)}>
                  Merch
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Astroneer Multi-Platform Purchase Action Bar */}
        <nav
          id="purchase"
          className={!pinned && !isHome ? 'hide-subpage-unpinned' : ''}
          style={
            !pinned && isHome
              ? { position: 'absolute', top: 'calc(100vh - 66px)', bottom: 'auto' }
              : undefined
          }
        >
          <div className="in">
            <div className="purchase-label hide-1024">
              <span>►</span> Pre-Order
            </div>
            <ul className="platform-list">
              <li>
                <a
                  className="platform-button"
                  href="/store"
                  id="buy-direct-btn"
                >
                  <img
                    alt="Direct Purchase"
                    className="platform-icon"
                    src="/icons/platform-direct.svg"
                  />
                  <span>Direct Access</span>
                </a>
              </li>
              <li>
                <a
                  className="platform-button"
                  href="https://store.playstation.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="buy-ps5-btn"
                >
                  <img
                    alt="Purchase on PlayStation"
                    className="platform-icon"
                    src="/icons/platform-ps5.svg"
                  />
                  <span>PlayStation 5</span>
                </a>
              </li>
              <li>
                <a
                  className="platform-button"
                  href="https://store.steampowered.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="buy-steam-btn"
                >
                  <img
                    alt="Purchase on Steam"
                    className="platform-icon"
                    src="/icons/platform-steam.svg"
                  />
                  <span>Steam</span>
                </a>
              </li>
              <li>
                <a
                  className="platform-button"
                  href="https://www.xbox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="buy-xbox-btn"
                >
                  <img
                    alt="Purchase on Xbox"
                    className="platform-icon"
                    src="/icons/platform-xbox.svg"
                  />
                  <span>Xbox Series X|S</span>
                </a>
              </li>
              <li>
                <a
                  className="platform-button"
                  href="https://store.epicgames.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="buy-epic-btn"
                >
                  <img
                    alt="Purchase on Epic Games"
                    className="platform-icon"
                    src="/icons/platform-epic.svg"
                  />
                  <span>Epic Games</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    </>
  );
}
