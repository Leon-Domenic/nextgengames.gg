'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';
import SmoothTimerBar from '@/components/board-brawl/SmoothTimerBar';
import { DICE_SKIN_MAP, DICE_SKINS } from '@/lib/board-brawl/diceSkins';
import { useTranslation } from '@/lib/board-brawl/i18n';
import { Dices, Sparkles, Clock, ShieldAlert } from 'lucide-react';

export default function DiceRoller3D({
  dice = [1, 1],
  lastResult,
  canRoll,
  onRoll,
  turnTimer = 25,
  turnDuration = 25,
  isMyTurn,
  activePlayerName = 'Opponent',
  diceSkin = 'classic_red',
  isInJail = false,
  onPayBail,
  canPayBail = false,
}) {
  const { t } = useTranslation();
  const maxDuration = turnDuration || 25;
  const isResetting = (turnTimer || 0) >= (maxDuration - 1);
  const progressPct = Math.min(100, Math.max(0, ((turnTimer || 0) / maxDuration) * 100));
  const [isRolling, setIsRolling] = useState(false);
  const [showDoublesCelebration, setShowDoublesCelebration] = useState(false);
  const lastRollIdRef = useRef(null);
  const autoUnlockTimerRef = useRef(null);

  const skin = DICE_SKIN_MAP[diceSkin] || DICE_SKINS[0];

  // Guarantee that whenever isMyTurn && canRoll is true, isRolling is NEVER stuck to true
  useEffect(() => {
    if (isMyTurn && canRoll) {
      setIsRolling(false);
    }
  }, [isMyTurn, canRoll]);

  // Failsafe auto-unlock watchdog: whenever isRolling becomes true, force unlock after 1200ms max
  useEffect(() => {
    if (isRolling) {
      if (autoUnlockTimerRef.current) clearTimeout(autoUnlockTimerRef.current);
      autoUnlockTimerRef.current = setTimeout(() => {
        setIsRolling(false);
      }, 1200);
      return () => {
        if (autoUnlockTimerRef.current) clearTimeout(autoUnlockTimerRef.current);
      };
    }
  }, [isRolling]);

  // Trigger 3D roll animation when a NEW unique roll ID arrives
  useEffect(() => {
    if (!lastResult || !lastResult.id || lastResult.id === lastRollIdRef.current) return;
    lastRollIdRef.current = lastResult.id;

    setIsRolling(true);
    sounds.playDiceRoll();

    const isFast = typeof window !== 'undefined' && localStorage.getItem('ngg_fast_dice_enabled') === 'true';
    const rollDuration = isFast ? 320 : 750;

    const rollTimeout = setTimeout(() => {
      setIsRolling(false);
      if (lastResult.isDoubles) {
        sounds.playDoublesSurge();
        setShowDoublesCelebration(true);
        setTimeout(() => setShowDoublesCelebration(false), isFast ? 1400 : 2400);
      }
    }, rollDuration);

    return () => clearTimeout(rollTimeout);
  }, [lastResult]);

  const handleRollClick = () => {
    if (isRolling) return;
    setIsRolling(true);

    // Auto-unlock timer (1.2s max lock) so the button always reactivates if any packet drops
    if (autoUnlockTimerRef.current) clearTimeout(autoUnlockTimerRef.current);
    autoUnlockTimerRef.current = setTimeout(() => {
      setIsRolling(false);
    }, 1200);

    onRoll?.();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 22px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: isMyTurn && canRoll
        ? `2px solid ${skin.accentColor || '#00f0ff'}`
        : '1.5px solid rgba(255, 255, 255, 0.14)',
      boxShadow: isMyTurn && canRoll
        ? `0 0 35px ${skin.accentColor || '#00f0ff'}66, 0 8px 32px rgba(0, 0, 0, 0.6)`
        : '0 8px 25px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      userSelect: 'none',
      gap: '8px',
      minWidth: '260px',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* Doubles Celebration Banner */}
      {showDoublesCelebration && (
        <div style={{
          position: 'absolute',
          top: '-28px',
          background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
          padding: '6px 20px',
          borderRadius: '20px',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '13px',
          letterSpacing: '1px',
          boxShadow: '0 0 30px #00f0ff',
          zIndex: 10,
          animation: 'bounce 0.5s ease infinite alternate',
        }}>
          {t('doublesExtraRoll')}
        </div>
      )}

      {/* Clear Visual Turn Status Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '8px',
      }}>
        {/* Turn Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: isMyTurn
            ? (canRoll ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)')
            : 'rgba(245, 158, 11, 0.18)',
          border: isMyTurn
            ? (canRoll ? '1px solid #22c55e' : '1px solid #38bdf8')
            : '1px solid #f59e0b',
          color: isMyTurn
            ? (canRoll ? '#4ade80' : '#7dd3fc')
            : '#fde047',
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isMyTurn ? (canRoll ? '#22c55e' : '#38bdf8') : '#f59e0b',
            boxShadow: isMyTurn ? '0 0 8px #22c55e' : '0 0 8px #f59e0b',
            display: 'inline-block',
          }} />
          <span>
            {isMyTurn
              ? (canRoll ? t('rollDice').toUpperCase() : t('resolvingAction').toUpperCase())
              : t('awaitingTurn').toUpperCase()}
          </span>
        </div>

        {/* Equipped Dice Skin Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: 800,
          color: skin.accentColor || '#fef08a',
          background: 'rgba(255, 255, 255, 0.07)',
          padding: '3px 9px',
          borderRadius: '10px',
        }}>
          <span>{skin.icon || '🎲'}</span>
          <span>{skin.name}</span>
        </div>
      </div>

      {/* Main Control / Status Content */}
      {isMyTurn && canRoll ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <button
            onClick={handleRollClick}
            disabled={isRolling}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 28px',
              background: isRolling
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : `linear-gradient(135deg, ${skin.accentColor || '#00f0ff'} 0%, #0284c7 100%)`,
              color: '#060709',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '16px',
              letterSpacing: '0.04em',
              cursor: isRolling ? 'default' : 'pointer',
              boxShadow: `0 0 25px ${skin.accentColor || '#00f0ff'}77, inset 0 1px 1px rgba(255, 255, 255, 0.5)`,
              transition: 'all 0.15s ease',
              transform: isRolling ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            <Dices size={22} className={isRolling ? 'animate-spin' : ''} />
            {isRolling
              ? t('rollingDice3D')
              : isInJail
              ? `${t('rollForDoubles')} (${turnTimer}s)`
              : `${t('roll3dDice')} (${turnTimer}s)`}
          </button>

          {/* Active Roll Timer Countdown Bar */}
          <SmoothTimerBar
            secondsRemaining={turnTimer}
            totalDuration={maxDuration}
            activeKey={`dice_${isMyTurn}_${canRoll}`}
            height={5}
            borderRadius={999}
            containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          />

          {isInJail && (
            <button
              onClick={() => onPayBail?.()}
              disabled={!canPayBail}
              style={{
                width: '100%',
                padding: '7px 14px',
                background: canPayBail ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: canPayBail ? '1.5px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                color: canPayBail ? '#fef08a' : '#64748b',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: canPayBail ? 'pointer' : 'not-allowed',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldAlert size={14} />
              <span>{t('payBailEscape')}</span>
            </button>
          )}
        </div>
      ) : (
        /* Opponent Turn or Action Resolving View */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#cbd5e1',
            fontWeight: 800,
          }}>
            <Clock size={16} color={isMyTurn ? '#38bdf8' : '#fbbf24'} />
            <span>
              {isMyTurn
                ? t('resolvingAction')
                : `${activePlayerName} (${turnTimer}s)...`}
            </span>
          </div>

          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 700,
          }}>
            {isMyTurn
              ? 'Complete or pass your action above'
              : 'Stand by for your roll turn'}
          </div>
        </div>
      )}
    </div>
  );
}
