'use client';

import React, { useEffect, useRef, useState } from 'react';
import DiceThrowOverlay from '@/components/board-brawl/DiceThrowOverlay';
import { sounds } from '@/lib/audio';

const SETTINGS_KEYS_WATCHED = new Set([
  'ngg_camera_mode',
  'ngg_particles_enabled',
  'ngg_high_contrast_tiles',
  'ngg_rent_overlays_enabled',
]);

function readStoredBool(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return val === 'true';
  } catch {
    return fallback;
  }
}

function resolveCameraMode(cameraModeProp, settingsProp) {
  if (typeof cameraModeProp === 'string' && cameraModeProp) return cameraModeProp;
  if (typeof settingsProp?.cameraMode === 'string' && settingsProp.cameraMode) {
    return settingsProp.cameraMode;
  }
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('ngg_camera_mode') || 'follow';
    } catch {}
  }
  return 'follow';
}

function resolveRenderSettings(settingsProp) {
  return {
    showRentOverlays:
      typeof settingsProp?.showRentOverlays === 'boolean'
        ? settingsProp.showRentOverlays
        : readStoredBool('ngg_rent_overlays_enabled', true),
    particlesEnabled:
      typeof settingsProp?.particlesEnabled === 'boolean'
        ? settingsProp.particlesEnabled
        : readStoredBool('ngg_particles_enabled', true),
    highContrastTiles:
      typeof settingsProp?.highContrastTiles === 'boolean'
        ? settingsProp.highContrastTiles
        : readStoredBool('ngg_high_contrast_tiles', false),
  };
}

function normalizeTargetingMode(tm) {
  if (!tm) return { active: false, eligibleTileIds: [], color: '#38bdf8' };
  let color = tm.color;
  if (typeof color === 'number') {
    color = '#' + (color & 0xffffff).toString(16).padStart(6, '0');
  } else if (typeof color === 'string') {
    const trimmed = color.trim();
    if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
      color = '#' + trimmed;
    } else if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(trimmed)) {
      color = trimmed;
    } else {
      color = '#38bdf8';
    }
  } else {
    color = '#38bdf8';
  }
  const eligibleTileIds = Array.isArray(tm.eligibleTileIds)
    ? tm.eligibleTileIds.map(Number).filter((id) => Number.isInteger(id) && id >= 0)
    : [];
  return {
    active: !!tm.active,
    eligibleTileIds,
    color,
  };
}

function serializePlayersPayload(playersList) {
  return JSON.stringify(
    (Array.isArray(playersList) ? playersList : [])
      .filter(Boolean)
      .map((p) => {
        const islandT = Number(p.islandTurns ?? p.island_turns ?? 0);
        return {
          ...p,
          islandTurns: islandT,
          island_turns: islandT,
          isArrested: islandT > 0,
          cash: p.cash ?? 0,
          isBankrupt: Boolean(p.isBankrupt),
          avatarColor: p.avatarColor || '#38bdf8',
        };
      }),
  );
}

function serializePropertiesPayload(propsMap) {
  const normalized = {};
  if (propsMap && typeof propsMap === 'object') {
    for (const [tid, pr] of Object.entries(propsMap)) {
      if (!pr || typeof pr !== 'object') continue;
      normalized[tid] = {
        ...pr,
        shielded: Boolean(pr.shielded),
      };
    }
  }
  return JSON.stringify(normalized);
}

export default function Board2DRust({
  activePlayerId,
  localPlayerId,
  myPlayerId,
  lastPayment,
  properties,
  players = [],
  lastDiceResult,
  diceSkin,
  communityJackpot = 0,
  matchTimeRemaining = 0,
  centerContent = null,
  targetingMode = null,
  debtSellBadges = [],
  cameraMode,
  settings,
  onTileClick,
  onInspectTile,
  onPawnMovementStart,
  onPawnMovementComplete,
  onPawnHop,
  onHoveredTileChange,
}) {
  const effectiveLocalPlayerId = localPlayerId ?? myPlayerId ?? '';
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const playersRef = useRef(players);
  playersRef.current = players;
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;
  const prevPropertiesRef = useRef(null);
  const activePlayerIdRef = useRef(activePlayerId);
  activePlayerIdRef.current = activePlayerId;
  const localPlayerIdRef = useRef(effectiveLocalPlayerId);
  localPlayerIdRef.current = effectiveLocalPlayerId;
  const lastSyncedRollIdRef = useRef(lastDiceResult?.id || null);
  const diceHoldUntilRef = useRef(0);
  const syncTimerRef = useRef(null);
  const lastEmittedHoverRef = useRef(null);
  const [hoveredTileId, setHoveredTileId] = useState(-1);
  const [tileCoords, setTileCoords] = useState([]);
  const [wasmError, setWasmError] = useState(null);
  const boardCenterRef = useRef({ nx: 0.5, ny: 355 / 720, zoom: 1 });

  const callbacksRef = useRef({
    onTileClick,
    onInspectTile,
    onPawnMovementStart,
    onPawnMovementComplete,
    onPawnHop,
    onHoveredTileChange,
    targetingMode,
    cameraMode,
    settings,
  });
  callbacksRef.current = {
    onTileClick,
    onInspectTile,
    onPawnMovementStart,
    onPawnMovementComplete,
    onPawnHop,
    onHoveredTileChange,
    targetingMode,
    cameraMode,
    settings,
  };

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let resizeObs = null;

    async function initWasm() {
      try {
        const wasmVer = process.env.NEXT_PUBLIC_WASM_BUILD || '1';
        const mod = await import(/* webpackIgnore: true */ `/wasm/board_brawl_renderer.js?v=${wasmVer}`);
        await mod.default({ module_or_path: `/wasm/board_brawl_renderer_bg.wasm?v=${wasmVer}` });
        if (cancelled || !canvasRef.current) return;

        const renderer = new mod.BoardRenderer('board-brawl-2d-canvas');
        rendererRef.current = renderer;

        renderer.set_movement_callbacks(
          (pid, tid) => callbacksRef.current.onPawnMovementStart?.(pid, tid),
          (pid, tid) => callbacksRef.current.onPawnMovementComplete?.(pid, tid),
        );
        if (typeof renderer.set_on_pawn_hop === 'function') {
          renderer.set_on_pawn_hop((pid, tid) => callbacksRef.current.onPawnHop?.(pid, tid));
        }

        const refreshTileCoords = () => {
          try {
            const raw = rendererRef.current?.get_tile_screen_coords_json?.();
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && !cancelled) {
                setTileCoords(parsed);
              }
            }
            const rawCenter = rendererRef.current?.get_board_center_screen_coords_json?.();
            if (rawCenter && !cancelled) {
              const parsedCenter = JSON.parse(rawCenter);
              if (
                parsedCenter &&
                Number.isFinite(parsedCenter.nx) &&
                Number.isFinite(parsedCenter.ny)
              ) {
                boardCenterRef.current = parsedCenter;
              }
            }
          } catch {}
        };

        const syncSize = () => {
          const el = containerRef.current;
          const canvas = canvasRef.current;
          if (!el || !canvas || !rendererRef.current) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.max(1, Math.floor(el.clientWidth * dpr));
          const h = Math.max(1, Math.floor(el.clientHeight * dpr));
          rendererRef.current.resize(w, h);
          refreshTileCoords();
        };

        syncSize();
        resizeObs = new ResizeObserver(syncSize);
        if (containerRef.current) {
          resizeObs.observe(containerRef.current);
        }

        // Initial state sync right after WASM init
        if (typeof renderer.set_camera_mode === 'function') {
          renderer.set_camera_mode(
            resolveCameraMode(callbacksRef.current.cameraMode, callbacksRef.current.settings),
          );
        }
        if (typeof renderer.set_render_settings_json === 'function') {
          renderer.set_render_settings_json(
            JSON.stringify(resolveRenderSettings(callbacksRef.current.settings)),
          );
        }
        renderer.sync_players_json(serializePlayersPayload(playersRef.current), performance.now());
        renderer.sync_properties_json(serializePropertiesPayload(propertiesRef.current));
        prevPropertiesRef.current = propertiesRef.current
          ? JSON.parse(JSON.stringify(propertiesRef.current))
          : {};
        renderer.set_targeting_mode_json(
          JSON.stringify(normalizeTargetingMode(callbacksRef.current.targetingMode)),
        );
        renderer.set_active_player_id(activePlayerIdRef.current || '');
        renderer.set_local_player_id?.(localPlayerIdRef.current || '');
        renderer.set_timer_seconds(Math.max(0, Math.floor(matchTimeRemaining || 0)));
        try {
          renderer.set_community_jackpot(BigInt(Math.round(communityJackpot || 0)));
        } catch {}
        refreshTileCoords();

        const frame = (now) => {
          if (cancelled || !rendererRef.current) return;
          rendererRef.current.render(now);
          if (
            typeof rendererRef.current.consume_camera_dirty === 'function' &&
            rendererRef.current.consume_camera_dirty()
          ) {
            refreshTileCoords();
          }
          rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);
      } catch (err) {
        console.error('WASM Board2DRust init failed:', err);
        if (!cancelled) setWasmError(err?.message || 'Failed to load 2D Rust board');
      }
    }

    initWasm();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (resizeObs) resizeObs.disconnect();
      if (rendererRef.current && typeof rendererRef.current.free === 'function') {
        try {
          rendererRef.current.free();
        } catch {}
      }
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r || typeof r.set_camera_mode !== 'function') return;
    r.set_camera_mode(resolveCameraMode(cameraMode, settings));
  }, [cameraMode, settings?.cameraMode]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r || typeof r.set_render_settings_json !== 'function') return;
    r.set_render_settings_json(JSON.stringify(resolveRenderSettings(settings)));
  }, [
    settings?.showRentOverlays,
    settings?.particlesEnabled,
    settings?.highContrastTiles,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncFromSettings = () => {
      const r = rendererRef.current;
      if (!r) return;
      if (typeof r.set_camera_mode === 'function') {
        r.set_camera_mode(
          resolveCameraMode(callbacksRef.current.cameraMode, callbacksRef.current.settings),
        );
      }
      if (typeof r.set_render_settings_json === 'function') {
        r.set_render_settings_json(
          JSON.stringify(resolveRenderSettings(callbacksRef.current.settings)),
        );
      }
    };

    const handleSettingsChanged = (e) => {
      const key = e?.detail?.key;
      if (!key || SETTINGS_KEYS_WATCHED.has(key)) {
        syncFromSettings();
      }
    };

    window.addEventListener('ngg_settings_changed', handleSettingsChanged);
    window.addEventListener('ngg_settings_reset', syncFromSettings);
    return () => {
      window.removeEventListener('ngg_settings_changed', handleSettingsChanged);
      window.removeEventListener('ngg_settings_reset', syncFromSettings);
    };
  }, []);

  useEffect(() => {
    if (hoveredTileId < 0) {
      if (lastEmittedHoverRef.current !== null) {
        lastEmittedHoverRef.current = null;
        callbacksRef.current.onHoveredTileChange?.(null);
      }
      return;
    }

    let coord = tileCoords.find((c) => c.id === hoveredTileId);
    if (!coord && rendererRef.current?.get_tile_screen_coords_json) {
      try {
        const parsed = JSON.parse(rendererRef.current.get_tile_screen_coords_json());
        if (Array.isArray(parsed)) {
          coord = parsed.find((c) => c.id === hoveredTileId);
        }
      } catch {}
    }
    if (!coord) return;

    const next = {
      tileId: hoveredTileId,
      xNorm: coord.nx,
      yNorm: coord.ny,
    };
    const prev = lastEmittedHoverRef.current;
    if (
      !prev ||
      prev.tileId !== next.tileId ||
      Math.abs(prev.xNorm - next.xNorm) > 1e-4 ||
      Math.abs(prev.yNorm - next.yNorm) > 1e-4
    ) {
      lastEmittedHoverRef.current = next;
      callbacksRef.current.onHoveredTileChange?.(next);
    }
  }, [hoveredTileId, tileCoords]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;

    const now = performance.now();
    if (lastDiceResult?.id && lastDiceResult.id !== lastSyncedRollIdRef.current) {
      lastSyncedRollIdRef.current = lastDiceResult.id;
      const isFast = typeof window !== 'undefined' && localStorage.getItem('ngg_fast_dice_enabled') === 'true';
      const flightDelay = isFast ? 280 : 540;
      diceHoldUntilRef.current = now + flightDelay;

      // High roll detection (sum >= 8 or doubles) to trigger character special animations (e.g. Cantino wing flap)
      const roll1 = Number(lastDiceResult.d1 || lastDiceResult.dice1 || 0);
      const roll2 = Number(lastDiceResult.d2 || lastDiceResult.dice2 || 0);
      const sum = Number(lastDiceResult.sum || (roll1 + roll2) || 0);
      const isDoubles = roll1 > 0 && roll1 === roll2;
      const isHigh = sum >= 8 || isDoubles;
      if (activePlayerId && typeof r.set_player_high_roll === 'function') {
        r.set_player_high_roll(activePlayerId, isHigh);
      }
    }

    const remaining = diceHoldUntilRef.current - now;
    if (remaining > 16) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        rendererRef.current?.sync_players_json(serializePlayersPayload(playersRef.current), performance.now());
      }, remaining);
      return;
    }

    r.sync_players_json(serializePlayersPayload(players), now);
  }, [players, lastDiceResult?.id]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.sync_properties_json(serializePropertiesPayload(properties));

    const prevMap = prevPropertiesRef.current;
    if (prevMap) {
      let built = false;
      let builtHotel = false;
      let sold = false;
      const keys = new Set([...Object.keys(prevMap), ...Object.keys(properties || {})]);
      keys.forEach((k) => {
        const prev = prevMap[k] || {};
        const cur = (properties || {})[k] || {};
        const prevOwner = prev.ownerId ?? prev.owner_id ?? null;
        const curOwner = cur.ownerId ?? cur.owner_id ?? null;
        const prevLvl = Number(prev.level || 0);
        const curLvl = Number(cur.level || 0);

        if (curOwner && (curLvl > prevLvl || (prevOwner && prevOwner !== curOwner))) {
          built = true;
          if (curLvl >= 5) builtHotel = true;
        } else if (prevOwner && (!curOwner || curLvl < prevLvl)) {
          sold = true;
        }
      });
      if (built) {
        sounds.playHouseConstruct?.(builtHotel);
      } else if (sold) {
        sounds.playPropertySell?.();
      }
    }
    prevPropertiesRef.current = properties ? JSON.parse(JSON.stringify(properties)) : {};
  }, [properties]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.set_local_player_id?.(effectiveLocalPlayerId || '');
  }, [effectiveLocalPlayerId]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    const normalized = normalizeTargetingMode(targetingMode);
    r.set_targeting_mode_json(JSON.stringify(normalized));
    if (normalized.active) {
      setHoveredTileId((prev) =>
        prev >= 0 && normalized.eligibleTileIds.includes(prev) ? prev : -1,
      );
    }
  }, [targetingMode]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.set_active_player_id(activePlayerId || '');
  }, [activePlayerId]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.set_timer_seconds(Math.max(0, Math.floor(matchTimeRemaining || 0)));
  }, [matchTimeRemaining]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    try {
      r.set_community_jackpot(BigInt(Math.round(communityJackpot || 0)));
    } catch {}
  }, [communityJackpot]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r || !lastPayment) return;
    const fromId = lastPayment.fromId || lastPayment.payerId;
    const toId = lastPayment.toId ?? lastPayment.receiverId;
    const fromP = players.find((p) => p.id === fromId);
    const toP = players.find((p) => p.id === toId);
    const fromTile = lastPayment.fromTile ?? lastPayment.fromTileId ?? fromP?.position ?? 0;
    const toTile = lastPayment.toTile ?? lastPayment.toTileId ?? toP?.position ?? 0;
    const now = performance.now();
    r.trigger_payment_arc(fromTile, toTile, now);

    // Trigger contextual pawn mood reactions (e.g. Cantino sad pout vs happy proud bounce)
    if (fromId && typeof r.trigger_pawn_mood === 'function') {
      r.trigger_pawn_mood(fromId, 'sad', 2800, now);
    }
    if (toId && typeof r.trigger_pawn_mood === 'function') {
      r.trigger_pawn_mood(toId, 'happy', 2800, now);
    }
  }, [lastPayment]);

  const handleMouseMove = (e) => {
    const r = rendererRef.current;
    const c = canvasRef.current;
    if (!r || !c) return;
    const rect = c.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const hit = r.on_mouse_move(nx, ny);
    setHoveredTileId(hit);
  };

  const handleMouseLeave = () => {
    const r = rendererRef.current;
    if (r && typeof r.on_mouse_move === 'function') {
      r.on_mouse_move(-1, -1);
    }
    setHoveredTileId(-1);
  };

  const handleClick = (e) => {
    const r = rendererRef.current;
    const c = canvasRef.current;
    if (!r || !c) return;
    const rect = c.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const hit = r.on_click(nx, ny);
    if (hit < 0) return;

    const tm = callbacksRef.current.targetingMode;
    if (tm?.active) {
      const eligibleIds = Array.isArray(tm.eligibleTileIds)
        ? tm.eligibleTileIds.map(Number).filter((id) => Number.isInteger(id) && id >= 0)
        : null;
      if (!eligibleIds || eligibleIds.includes(hit)) {
        if (typeof tm.onSelectTarget === 'function') {
          tm.onSelectTarget(hit);
        } else {
          callbacksRef.current.onTileClick?.(hit);
        }
      }
      return;
    }
    callbacksRef.current.onInspectTile?.(hit);
  };

  const tileCoordById =
    Array.isArray(debtSellBadges) && debtSellBadges.length > 0 && tileCoords.length > 0
      ? new Map(tileCoords.map((coord) => [coord.id, coord]))
      : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <canvas
        id="board-brawl-2d-canvas"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: hoveredTileId >= 0 ? 'pointer' : 'default',
        }}
      />

      {wasmError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 15, 25, 0.85)',
            color: '#f87171',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          {wasmError}
        </div>
      )}

      <DiceThrowOverlay
        lastDiceResult={lastDiceResult}
        players={players}
        diceSkin={diceSkin}
        containerRef={containerRef}
        getBoardCenter={() => {
          try {
            const rawCenter = rendererRef.current?.get_board_center_screen_coords_json?.();
            if (rawCenter) {
              const parsed = JSON.parse(rawCenter);
              if (parsed && Number.isFinite(parsed.nx) && Number.isFinite(parsed.ny)) {
                boardCenterRef.current = parsed;
              }
            }
          } catch {}
          return boardCenterRef.current;
        }}
      />

      {tileCoordById && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 25,
          }}
        >
          <style>{`
            @keyframes bb-debt-badge-pulse {
              0%, 100% {
                transform: translate(-50%, -50%) scale(1.1);
                box-shadow: 0 0 10px rgba(250, 204, 21, 0.85), 0 0 0 1px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.85);
              }
              50% {
                transform: translate(-50%, -50%) scale(1.18);
                box-shadow: 0 0 16px rgba(253, 224, 71, 1), 0 0 0 1px rgba(0, 0, 0, 0.9), 0 3px 8px rgba(0, 0, 0, 0.9);
              }
            }
          `}</style>
          {debtSellBadges.map((badge) => {
            const tid = Number(badge?.tileId);
            const coord = tileCoordById.get(tid);
            if (!coord) return null;
            const isSelected = !!badge.selected;
            return (
              <div
                key={tid}
                style={{
                  position: 'absolute',
                  left: `${coord.nx * 100}%`,
                  top: `${coord.ny * 100}%`,
                  transform: `translate(-50%, -50%) scale(${isSelected ? 1.12 : 1})`,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  fontSize: '10px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  color: isSelected ? '#ecfdf5' : '#fef3c7',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.96) 0%, rgba(5, 150, 105, 0.96) 100%)'
                    : 'linear-gradient(135deg, rgba(217, 119, 6, 0.95) 0%, rgba(146, 64, 14, 0.95) 100%)',
                  border: isSelected
                    ? '1.5px solid #fde047'
                    : '1px solid rgba(253, 224, 71, 0.7)',
                  boxShadow: isSelected
                    ? '0 0 12px rgba(250, 204, 21, 0.85), 0 0 0 1px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.85)'
                    : '0 0 0 1px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.85)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.95)',
                  animation: isSelected ? 'bb-debt-badge-pulse 1.2s ease-in-out infinite' : undefined,
                  transition: 'transform 140ms ease, box-shadow 140ms ease',
                }}
              >
                {badge.refundText}
              </div>
            );
          })}
        </div>
      )}

      {centerContent && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>{centerContent}</div>
        </div>
      )}
    </div>
  );
}
