'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';
import { Sparkles, Plane, Trophy, Dice6, ArrowRight } from 'lucide-react';

export default function TurnAnnouncementBanner({
  activePlayer,
  isMyTurn,
  turnState = 'roll',
  turnIndex = 0,
}) {
  const [banner, setBanner] = useState(null);
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!activePlayer) return;

    // Unique turn key: player id + turn state + turn counter
    const currentKey = `${activePlayer.id}_${turnIndex}_${turnState}`;
    if (lastKeyRef.current === currentKey) return;
    lastKeyRef.current = currentKey;

    const isFlight = turnState === 'flight_select';
    const isChampionship = turnState === 'festival_select';
    const isStartLaunchpad = turnState === 'start_tile_select';

    const bannerData = {
      id: currentKey,
      player: activePlayer,
      isMyTurn,
      isFlight,
      isChampionship,
      isStartLaunchpad,
      title: isFlight
        ? (isMyTurn ? '✈️ YOUR FLIGHT DEPARTURE!' : `✈️ ${activePlayer.name.toUpperCase()}'S FLIGHT`)
        : isChampionship
        ? (isMyTurn ? '🏆 WORLD CHAMPIONSHIP SELECTION!' : `🏆 ${activePlayer.name.toUpperCase()}'S CHAMPIONSHIP`)
        : isStartLaunchpad
        ? (isMyTurn ? '🚀 START LAUNCHPAD ACTION!' : `🚀 ${activePlayer.name.toUpperCase()}'S START PRIVILEGE`)
        : (isMyTurn ? '⭐ YOUR TURN!' : `${activePlayer.name.toUpperCase()}'S TURN`),
      subtitle: isFlight
        ? (isMyTurn ? 'Choose any highlighted destination on the board to fly!' : 'Selecting a flight destination...')
        : isChampionship
        ? (isMyTurn ? 'Select any owned city to host the Championship for 2X Rent!' : 'Selecting a city to host the Championship...')
        : isStartLaunchpad
        ? (isMyTurn ? 'Choose: One More Roll, Remote City Upgrade (+1), or Shield!' : 'Choosing Launchpad action...')
        : (isMyTurn ? 'Roll the 3D dice or play an action card!' : 'Preparing 3D dice roll...'),
      color: isStartLaunchpad ? '#10b981' : isMyTurn ? '#38bdf8' : (activePlayer.avatarColor || '#f59e0b'),
    };

    setBanner(bannerData);

    try {
      if (isMyTurn) {
        sounds.playDoublesSurge?.();
      } else {
        sounds.playHover?.();
      }
    } catch (e) {}

    const timer = setTimeout(() => {
      setBanner((prev) => (prev?.id === currentKey ? null : prev));
    }, 2200);

    return () => clearTimeout(timer);
  }, [activePlayer?.id, isMyTurn, turnState, turnIndex]);

  if (!banner) return null;

  return (
    <div
      key={banner.id}
      style={{
        position: 'fixed',
        top: '16%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 88,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'flightBannerIn 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes flightBannerIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -40px) scale(0.85);
          }
          12% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.04);
          }
          20% {
            transform: translate(-50%, 0) scale(1.0);
          }
          82% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 25px) scale(0.92);
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 28px',
          borderRadius: '999px',
          background: banner.isMyTurn
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.96) 0%, rgba(59, 130, 246, 0.96) 50%, rgba(147, 51, 234, 0.96) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)',
          border: banner.isMyTurn
            ? '2.5px solid #ffffff'
            : `2.5px solid ${banner.color}`,
          boxShadow: banner.isMyTurn
            ? '0 0 45px rgba(56, 189, 248, 0.7), 0 16px 40px rgba(0, 0, 0, 0.7)'
            : `0 0 35px ${banner.color}66, 0 16px 40px rgba(0, 0, 0, 0.7)`,
          backdropFilter: 'blur(12px)',
          color: '#ffffff',
        }}
      >
        {/* Avatar Token Icon */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: `${banner.color}33`,
            border: `2px solid ${banner.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: `0 0 16px ${banner.color}88`,
            flexShrink: 0,
          }}
        >
          {banner.isFlight ? '✈️' : banner.isChampionship ? '🏆' : (banner.player?.avatarToken ? '🎩' : '🤖')}
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: banner.isMyTurn ? '#ffffff' : (banner.color || '#ffffff'),
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{banner.title}</span>
            {banner.isMyTurn && (
              <span
                style={{
                  background: '#ffffff',
                  color: '#0284c7',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '1px',
                }}
              >
                LIVE
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.88)',
              marginTop: '1px',
            }}
          >
            {banner.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
