'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CHARACTER_MAP } from '@/lib/board-brawl/characters';
import { sounds } from '@/lib/audio';
import { Sparkles, Crown, Dice6, Play } from 'lucide-react';

export default function StartingPlayerSpinner({
  startingSpin,
  players = [],
  currentUserId,
  onComplete,
}) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLanded, setIsLanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [visible, setVisible] = useState(true);

  const spinRef = useRef({
    step: 0,
    timer: null,
    targetIndex: 0,
    startTime: Date.now(),
  });

  useEffect(() => {
    if (!startingSpin || !players.length) return;

    const targetIdx = Math.max(
      0,
      Math.min(players.length - 1, startingSpin.chosenPlayerIndex ?? 0)
    );
    spinRef.current.targetIndex = targetIdx;
    spinRef.current.startTime = startingSpin.startTime || Date.now();

    // Sequence of delays (ms) for dramatic deceleration
    // Fast spin -> progressive slowdown -> final lock on target
    const hopDelays = [
      60, 60, 60, 70, 70, 80, 80, 90, 100, 120, 140, 170, 210, 260, 330, 420, 540,
    ];

    // Compute starting index so the final hop lands EXACTLY on targetIndex
    const totalHops = hopDelays.length;
    let currentIdx = (targetIdx - (totalHops % players.length) + players.length) % players.length;
    setHighlightedIndex(currentIdx);

    let hopCount = 0;

    const runHop = () => {
      if (hopCount >= totalHops) {
        // Landed on chosen player!
        setHighlightedIndex(targetIdx);
        setIsLanded(true);

        try {
          sounds.playDoublesSurge?.();
          setTimeout(() => {
            sounds.playCash?.();
          }, 300);
        } catch (e) {}

        setShowCelebration(true);

        // Hold celebration for 1.3 seconds, then complete
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            onComplete?.();
          }, 300);
        }, 1400);
        return;
      }

      currentIdx = (currentIdx + 1) % players.length;
      setHighlightedIndex(currentIdx);

      try {
        sounds.playPawnStep?.();
      } catch (e) {}

      const delay = hopDelays[hopCount];
      hopCount++;
      spinRef.current.timer = setTimeout(runHop, delay);
    };

    spinRef.current.timer = setTimeout(runHop, 120);

    return () => {
      if (spinRef.current.timer) clearTimeout(spinRef.current.timer);
    };
  }, [startingSpin, players.length]);

  if (!startingSpin || !visible || !players.length) return null;

  const targetPlayer = players[startingSpin.chosenPlayerIndex] || players[0];
  const isMe = String(targetPlayer?.id) === String(currentUserId);
  const chosenColor = targetPlayer?.avatarColor || '#38bdf8';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'spinModalFadeIn 0.3s ease-out',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes spinModalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes haloPulse {
          0%, 100% { box-shadow: 0 0 35px #f59e0b, 0 0 70px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 65px #f59e0b, 0 0 120px rgba(245, 158, 11, 0.7); }
        }
        @keyframes winnerPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.16); }
          70% { transform: scale(1.08); }
          100% { transform: scale(1.12); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* Top Cyber Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 20px',
          borderRadius: '999px',
          background: isLanded
            ? 'linear-gradient(90deg, #f59e0b, #eab308)'
            : 'linear-gradient(90deg, #0284c7, #38bdf8)',
          color: isLanded ? '#000000' : '#ffffff',
          fontWeight: 900,
          fontSize: '12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          boxShadow: isLanded
            ? '0 0 25px rgba(245, 158, 11, 0.6)'
            : '0 0 20px rgba(56, 189, 248, 0.5)',
          marginBottom: '16px',
          transition: 'all 0.3s ease',
        }}
      >
        <Dice6 size={15} />
        <span>{isLanded ? 'FIRST TURN DECIDED!' : 'DECIDING FIRST TURN...'}</span>
        <Sparkles size={15} />
      </div>

      {/* Main Title Banner */}
      <h2
        style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          margin: '0 0 8px 0',
          textAlign: 'center',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
        }}
      >
        {isLanded ? (
          isMe ? (
            <span style={{ color: '#38bdf8' }}>🎉 YOU ROLL FIRST!</span>
          ) : (
            <span style={{ color: chosenColor }}>
              👑 {targetPlayer.name.toUpperCase()} ROLLS FIRST!
            </span>
          )
        ) : (
          'WHO WILL START THE MATCH?'
        )}
      </h2>

      <p
        style={{
          color: '#94a3b8',
          fontSize: '14px',
          fontWeight: 600,
          margin: '0 0 32px 0',
          textAlign: 'center',
        }}
      >
        {isLanded
          ? 'Get ready! The tournament is about to begin...'
          : 'Cycling through all connected tycoons...'}
      </p>

      {/* ROULETTE CAROUSEL CONTAINER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          maxWidth: '900px',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '24px',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
      >
        {players.map((p, idx) => {
          const isSelected = highlightedIndex === idx;
          const isWinner = isLanded && idx === spinRef.current.targetIndex;
          const char = CHARACTER_MAP[p.avatarToken] || {};
          const avatarSrc = p.avatar || char.avatar || '/avatars/duck.png';
          const playerColor = p.avatarColor || '#38bdf8';

          return (
            <div
              key={p.id || idx}
              style={{
                width: '130px',
                padding: '16px 12px',
                borderRadius: '20px',
                background: isWinner
                  ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.3) 0%, rgba(30, 41, 59, 0.95) 100%)'
                  : isSelected
                  ? 'linear-gradient(145deg, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'rgba(15, 23, 42, 0.7)',
                border: isWinner
                  ? '3px solid #f59e0b'
                  : isSelected
                  ? `3px solid ${playerColor}`
                  : '1.5px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isWinner
                  ? '0 0 35px rgba(245, 158, 11, 0.8), 0 10px 25px rgba(0,0,0,0.6)'
                  : isSelected
                  ? `0 0 25px ${playerColor}88, 0 8px 20px rgba(0,0,0,0.5)`
                  : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transform: isWinner ? 'scale(1.12)' : isSelected ? 'scale(1.04)' : 'scale(0.95)',
                transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                animation: isWinner ? 'haloPulse 1.2s infinite ease-in-out' : 'none',
              }}
            >
              {/* Winner Crown Badge */}
              {isWinner && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-16px',
                    background: '#f59e0b',
                    color: '#000000',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.6)',
                  }}
                >
                  <Crown size={12} />
                  <span>START</span>
                </div>
              )}

              {/* Avatar Image Circle */}
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `2px solid ${isWinner ? '#f59e0b' : playerColor}`,
                  boxShadow: `0 0 15px ${playerColor}55`,
                  marginBottom: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarSrc}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Player Name */}
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: isWinner ? '#fef08a' : '#ffffff',
                  maxWidth: '110px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </div>

              {/* Role / You Tag */}
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: String(p.id) === String(currentUserId) ? '#38bdf8' : '#94a3b8',
                }}
              >
                {String(p.id) === String(currentUserId)
                  ? 'YOU'
                  : p.isBot
                  ? 'AI BOT'
                  : 'RIVAL'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Prompt */}
      {showCelebration && (
        <div
          style={{
            marginTop: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#38bdf8',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <Play size={16} fill="#38bdf8" />
          <span>MATCH STARTING NOW</span>
        </div>
      )}
    </div>
  );
}
