'use client';

import React, { useState } from 'react';
import { CARD_RARITY } from '@/lib/board-brawl/cards';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { t } from '@/lib/board-brawl/i18n';
import { Sparkles, Zap, Shield, Target, X, Check, ArrowUpRight, Flame } from 'lucide-react';

export default function ActionCardDock({
  cards = [],
  myPlayer,
  gameState,
  onPlayCard,
  onStartMapTargeting,
  disabled = false,
  isMyTurn = true,
}) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [targetPayload, setTargetPayload] = useState({});

  if (!cards || cards.length === 0) return null;

  const handleOpenCard = (card) => {
    if (disabled || !isMyTurn) return;
    if (card.id === 'demolition_strike' && onStartMapTargeting) {
      const oppTileIds = Object.keys(gameState?.properties || {}).filter((tId) => {
        const prop = gameState.properties[tId];
        const tile = TILES[tId];
        return prop?.ownerId && prop.ownerId !== myPlayer?.id && tile?.type === 'city';
      }).map(Number);

      if (oppTileIds.length === 0) {
        alert('No opponent cities found on the board to demolish!');
        return;
      }
      try { sounds.playCardDraw?.(); } catch (e) {}
      onStartMapTargeting({
        cardId: card.id,
        cardTitle: card.title,
        type: 'demolition',
        eligibleTileIds: oppTileIds,
      });
      setSelectedCard(null);
      return;
    }
    setSelectedCard(card);
    setTargetPayload({});
    try {
      sounds.playCardDraw?.();
    } catch (e) {}
  };

  const handleConfirmPlay = () => {
    if (disabled || !isMyTurn || !selectedCard) return;

    if (selectedCard.id === 'toll_shield') {
      try { sounds.playShield?.(); } catch (e) {}
    } else {
      try { sounds.playCardPlay?.(); } catch (e) {}
    }

    onPlayCard?.(selectedCard.id, targetPayload);
    setSelectedCard(null);
    setTargetPayload({});
  };

  // Pre-calculate target options
  const opponentCities = Object.keys(gameState?.properties || {}).filter((tId) => {
    const prop = gameState.properties[tId];
    const tile = TILES[tId];
    return prop?.ownerId && prop.ownerId !== myPlayer?.id && tile?.type === 'city';
  });

  const unownedAffordableCities = Object.keys(gameState?.properties || {}).filter((tId) => {
    const prop = gameState.properties[tId];
    const tile = TILES[tId];
    return !prop.ownerId && tile?.type === 'city' && (myPlayer?.cash || 0) >= tile.price;
  });

  const opponents = (gameState?.players || []).filter(
    (p) => p.id !== myPlayer?.id && !p.isBankrupt
  );

  return (
    <>
      {/* Dock Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        {/* Floating Mini Header */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '999px',
            padding: '4px 12px',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <Sparkles size={12} />
          <span>{t('actionCardsTitle', {}, 'ACTION CARDS')} ({cards.length}/3)</span>
        </div>

        {/* Hand Cards Fan */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {cards.map((card, idx) => {
            const rarity = CARD_RARITY[card.rarity] || CARD_RARITY.COMMON;
            return (
              <button
                key={`${card.id}_${idx}`}
                onClick={() => handleOpenCard(card)}
                title={(disabled || !isMyTurn) ? `${card.title} (Can only be played on your turn)` : card.title}
                disabled={disabled}
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '124px',
                  borderRadius: '14px',
                  background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                  border: `2px solid ${rarity.border}`,
                  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px ${rarity.border}44`,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 6px',
                  color: '#ffffff',
                  transform: 'translateY(0px)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(-12px) scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 14px 28px rgba(0,0,0,0.6), 0 0 24px ${rarity.border}88`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px ${rarity.border}44`;
                  }
                }}
              >
                {/* Rarity Tag */}
                <div
                  style={{
                    fontSize: '8px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    color: rarity.border,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('rarity_' + card.rarity?.toLowerCase(), {}, card.rarity)}
                </div>

                {/* Card Icon */}
                <div style={{ fontSize: '32px' }}>{card.icon}</div>

                {/* Title */}
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textAlign: 'center',
                    lineHeight: 1.1,
                    color: '#f8fafc',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t(card.id + '_title', {}, t(card.title, {}, card.title))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Inspection / Play Modal */}
      {selectedCard && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 7, 20, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 95,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '400px',
              maxWidth: '92vw',
              maxHeight: 'min(90vh, 580px)',
              overflowY: 'auto',
              background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
              border: `2px solid ${CARD_RARITY[selectedCard.rarity]?.border || '#38bdf8'}`,
              borderRadius: '24px',
              boxShadow: `0 0 50px ${CARD_RARITY[selectedCard.rarity]?.border}55, 0 25px 50px -12px rgba(0, 0, 0, 0.8)`,
              padding: '24px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* Top Pill */}
            <div
              style={{
                background: CARD_RARITY[selectedCard.rarity]?.border,
                color: '#000000',
                fontWeight: 900,
                fontSize: '11px',
                letterSpacing: '0.1em',
                padding: '4px 14px',
                borderRadius: '999px',
                textTransform: 'uppercase',
              }}
            >
              {t(selectedCard.rarity?.toLowerCase() + 'ActionCard', {}, `${selectedCard.rarity} ACTION CARD`)}
            </div>

            {/* Icon */}
            <div
              style={{
                marginTop: '16px',
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${CARD_RARITY[selectedCard.rarity]?.border}33 0%, rgba(0,0,0,0.5) 80%)`,
                border: `2px solid ${CARD_RARITY[selectedCard.rarity]?.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
              }}
            >
              {selectedCard.icon}
            </div>

            <h3 style={{ margin: '12px 0 4px 0', fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
              {t(selectedCard.id + '_title', {}, t(selectedCard.title, {}, selectedCard.title))}
            </h3>

            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: CARD_RARITY[selectedCard.rarity]?.border,
                marginBottom: '10px',
              }}
            >
              {t(selectedCard.id + '_badge', {}, t(selectedCard.badge, {}, selectedCard.badge))}
            </div>

            <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#cbd5e1', padding: '0 8px', margin: 0 }}>
              {t(selectedCard.id + '_desc', {}, t(selectedCard.description, {}, selectedCard.description))}
            </p>

            {/* Target Selection Logic */}
            <div style={{ marginTop: '16px', width: '100%' }}>
              {selectedCard.id === 'loaded_dice' && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                    {t('selectNextRoll', {}, 'Select Your Exact Next Roll:')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <button
                        key={num}
                        onClick={() => setTargetPayload({ value: num })}
                        style={{
                          padding: '8px 0',
                          borderRadius: '8px',
                          border: targetPayload.value === num ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                          background: targetPayload.value === num ? '#0284c7' : 'rgba(255,255,255,0.06)',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCard.id === 'demolition_strike' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '8px' }}>
                    {t('directMapTargeting', {}, 'Direct 3D Map Targeting:')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                    {t('demolishMapInstruction', {}, 'Click any highlighted opponent city beacon directly on the 3D world map to demolish!')}
                  </div>
                  <button
                    onClick={() => {
                      if (opponentCities.length === 0) {
                        alert('No opponent cities found to demolish!');
                        return;
                      }
                      onStartMapTargeting?.({
                        cardId: selectedCard.id,
                        cardTitle: selectedCard.title,
                        type: 'demolition',
                        eligibleTileIds: opponentCities.map(Number),
                      });
                      setSelectedCard(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <span>{t('aimSelectOnBoard', {}, '🎯 AIM & SELECT TARGET ON BOARD')}</span>
                  </button>
                </div>
              )}

              {selectedCard.id === 'remote_buy' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{t('selectUnownedCity', {}, 'Select Unowned City:')}</span>
                    {onStartMapTargeting && unownedAffordableCities.length > 0 && (
                      <button
                        onClick={() => {
                          onStartMapTargeting({
                            cardId: selectedCard.id,
                            cardTitle: selectedCard.title,
                            type: 'remote_buy',
                            eligibleTileIds: unownedAffordableCities.map(Number),
                          });
                          setSelectedCard(null);
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid #10b981',
                          color: '#34d399',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {t('selectOn3dMap', {}, '🎯 Select on 3D Map')}
                      </button>
                    )}
                  </div>
                  {unownedAffordableCities.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#f87171' }}>{t('noAffordableCities', {}, 'No affordable unowned cities available!')}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {unownedAffordableCities.slice(0, 6).map((tId) => {
                        const tile = TILES[tId];
                        const isSelected = targetPayload.tileId === parseInt(tId);
                        return (
                          <button
                            key={tId}
                            onClick={() => setTargetPayload({ tileId: parseInt(tId) })}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                              background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>{tile.name}</span>
                            <span style={{ fontSize: '12px', color: '#6ee7b7' }}>${tile.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {(selectedCard.id === 'gravity_magnet' || selectedCard.id === 'mega_tomato') && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                    {t('selectTargetOpponent', {}, 'Select Target Opponent:')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {opponents.map((opp) => {
                      const isSelected = targetPayload.targetPlayerId === opp.id;
                      return (
                        <button
                          key={opp.id}
                          onClick={() => setTargetPayload({ targetPlayerId: opp.id })}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.05)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>{opp.name}</span>
                          <span style={{ fontSize: '12px', color: '#d8b4fe' }}>{opp.cash} CR</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCard.id === 'warp_drive' && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                    {t('selectDestinationCorner', {}, 'Select Destination Corner:')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { id: 0, name: '🏁 START', note: '+$250 Salary' },
                      { id: 8, name: '⛓️ PRISON', note: 'Prison Cell' },
                      { id: 16, name: '✈️ AIRPORT', note: 'Flight' },
                      { id: 24, name: '🍅 ARMORY', note: '+2 Tomatoes' },
                    ].map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => setTargetPayload({ tileId: dest.id })}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '10px',
                          border: targetPayload.tileId === dest.id ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                          background: targetPayload.tileId === dest.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                          color: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: '11px' }}>{dest.name}</span>
                        <span style={{ fontSize: '9px', color: '#94a3b8' }}>{dest.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Play Button */}
            <div style={{ marginTop: '20px', width: '100%', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedCard(null)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {t('cancel', {}, 'Cancel')}
              </button>
              <button
                onClick={handleConfirmPlay}
                style={{
                  flex: 2,
                  padding: '12px 0',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>{t(selectedCard.id + '_actionText', {}, t(selectedCard.actionText, {}, selectedCard.actionText || t('playCard', {}, 'PLAY CARD')))}</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
