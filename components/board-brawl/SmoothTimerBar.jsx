'use client';

import React, { useEffect, useRef } from 'react';

/**
 * High-Performance 60 FPS Smooth Timer Bar
 * - Runs a lightweight requestAnimationFrame loop for continuous, silky-smooth visual drainage
 * - Completely avoids CSS transition interruptions, stalling, or snapping caused by React re-renders
 * - Synchronizes with server-side 1-second ticks smoothly with zero jitter
 * - Instantly resets/snaps on turn changes or anti-snipe time surges (never animates backwards)
 * - Dynamic color shifting: Green (>35%) -> Amber (15%-35%) -> Crimson Urgent (<=15%) with pulse glow
 */
export default function SmoothTimerBar({
  secondsRemaining = 25,
  totalDuration = 25,
  activeKey = '',
  height = 4,
  borderRadius = 999,
  containerStyle = {},
  barStyle = {},
  showGlow = true,
}) {
  const barRef = useRef(null);
  const animFrameRef = useRef(null);
  const syncStateRef = useRef({
    currentProgress: 1.0,
    targetProgress: 1.0,
    lastServerSeconds: secondsRemaining,
    lastSyncTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    activeKey: activeKey,
  });

  // Handle activeKey changes (turn switch, new player) or time surges (anti-snipe)
  useEffect(() => {
    const s = syncStateRef.current;
    const duration = Math.max(1, totalDuration || 25);
    const newProgress = Math.min(1.0, Math.max(0, (secondsRemaining || 0) / duration));
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // If turn changed OR time surged upwards by > 1.5s (e.g. anti-snipe or reset), snap immediately
    if (s.activeKey !== activeKey || secondsRemaining > s.lastServerSeconds + 1.5) {
      s.activeKey = activeKey;
      s.currentProgress = newProgress;
      s.targetProgress = newProgress;
      s.lastServerSeconds = secondsRemaining;
      s.lastSyncTime = now;
      if (barRef.current) {
        barRef.current.style.width = `${(newProgress * 100).toFixed(2)}%`;
      }
      return;
    }

    // Normal tick update: set target progress & sync timestamp
    s.targetProgress = newProgress;
    s.lastServerSeconds = secondsRemaining;
    s.lastSyncTime = now;
  }, [secondsRemaining, totalDuration, activeKey]);

  useEffect(() => {
    const barEl = barRef.current;
    if (!barEl) return;

    let lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const loop = (now) => {
      const delta = Math.min(0.1, (now - lastFrameTime) / 1000); // Clamped delta
      lastFrameTime = now;
      const s = syncStateRef.current;
      const duration = Math.max(1, totalDuration || 25);

      // Project expected progress based on elapsed time since last server sync
      const timeSinceSync = Math.max(0, (now - s.lastSyncTime) / 1000);
      const projectedProgress = Math.max(0, s.targetProgress - (timeSinceSync / duration) * 0.95);

      // Smoothly approach the projected progress
      const diff = projectedProgress - s.currentProgress;
      if (diff > 0.08) {
        // Snapped up (turn reset or anti-snipe)
        s.currentProgress = projectedProgress;
      } else {
        // Continuous smooth drain towards target
        s.currentProgress += diff * Math.min(1.0, delta * 7.5);
        // Micro-decrement so the bar glides seamlessly without freezing between 1s server ticks
        s.currentProgress = Math.max(0, Math.min(1.0, s.currentProgress - (delta / duration) * 0.06));
      }

      const pct = Math.max(0, Math.min(100, s.currentProgress * 100));
      barEl.style.width = `${pct.toFixed(2)}%`;

      // Dynamic color & glow
      let color = '#22c55e'; // Green (> 35%)
      let glow = 'none';
      if (pct <= 15) {
        color = '#ef4444'; // Red (<= 15%)
        if (showGlow) glow = '0 0 10px #ef4444, 0 0 4px #ef4444';
      } else if (pct <= 35) {
        color = '#f59e0b'; // Amber (15% - 35%)
        if (showGlow) glow = '0 0 6px #f59e0b';
      }

      barEl.style.backgroundColor = color;
      barEl.style.boxShadow = glow;

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [totalDuration, showGlow]);

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        position: 'relative',
        ...containerStyle,
      }}
    >
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#22c55e',
          borderRadius: `${borderRadius}px`,
          willChange: 'width, background-color, box-shadow',
          ...barStyle,
        }}
      />
    </div>
  );
}
