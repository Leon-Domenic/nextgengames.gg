'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Eye, Compass, Layers } from 'lucide-react';
import { getBoardBackground } from '@/lib/board-brawl/boardBackgrounds';

/**
 * Interactive 3D Perspective Mini-Arena Showcase for Board Brawl Shop.
 * Renders high-fidelity representation of the board background theme
 * including dynamic pitch texture, glowing neon perimeter rail,
 * luxury outer frame, floating jackpot, and themed particle aura.
 */
export default function ShopBoardPreview3D({ background = 'classic_stadium' }) {
  const bg = typeof background === 'string' ? getBoardBackground(background) : background;
  const canvasRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 42, ry: 0, scale: 1 });
  const [isHovered, setIsHovered] = useState(false);
  const [viewMode, setViewMode] = useState('isometric'); // 'isometric' | 'topdown'

  // Render authentic dynamic pitch texture on preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 360;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 1. Base Pitch Fill
    ctx.fillStyle = bg.palette.pitchBase || '#16a34a';
    ctx.fillRect(0, 0, width, height);

    // 2. Pattern Rendering based on theme
    const pType = bg.palette.patternType;

    if (pType === 'stripes') {
      // Classic Stadium diagonal lawn stripes
      const stripeW = 16;
      for (let x = -width; x < width * 2; x += stripeW) {
        const isEven = Math.floor(x / stripeW) % 2 === 0;
        ctx.fillStyle = isEven ? '#22c55e' : '#16a34a';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW + height, height);
        ctx.lineTo(x + height, height);
        ctx.closePath();
        ctx.fill();
      }
      // Chalk perimeter
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, width - 60, height - 60);

    } else if (pType === 'hex_matrix') {
      // Cyber Neon Tokyo 2099 Hex Grid & Circuit Matrix
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, width, height);

      // Cyan grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= width; g += 20) {
        ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(width, g); ctx.stroke();
      }

      // Concentric cyber reticle rings
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Neon circuit nodes
      const nodes = [
        [80, 80], [280, 80], [80, 280], [280, 280],
        [180, 90], [180, 270], [90, 180], [270, 180]
      ];
      nodes.forEach(([nx, ny]) => {
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(width / 2, height / 2);
        ctx.stroke();
      });

    } else if (pType === 'damask_diamonds') {
      // High Roller 24K Casino Velvet Baize with Gold Diamond Monograms
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2);
      grad.addColorStop(0, '#881337');
      grad.addColorStop(1, '#4c0519');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Gold damask diamond grid
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
      ctx.lineWidth = 1.5;
      const step = 28;
      for (let x = -width; x < width * 2; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + height, height); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, height); ctx.lineTo(x + height, 0); ctx.stroke();
      }

      // Center gold ornate medallion
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, width - 80, height - 80);

    } else if (pType === 'magma_cracks') {
      // Volcanic Magma Core Caldera with Fiery Fissures
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);

      // Branching glowing lava fissures
      const fissures = [
        [[50, 60], [110, 120], [180, 180], [250, 220], [310, 290]],
        [[300, 60], [240, 130], [180, 180], [120, 240], [60, 310]],
        [[180, 30], [175, 110], [180, 180], [185, 270], [180, 330]],
        [[30, 180], [110, 185], [180, 180], [260, 175], [330, 180]],
      ];

      // Outer glow
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      fissures.forEach(branch => {
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.5)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        branch.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 6;
        ctx.beginPath();
        branch.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        branch.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      });

    } else if (pType === 'nebula_stars') {
      // Cosmic Nebula & Deep Space Starlight Void
      ctx.fillStyle = '#03030d';
      ctx.fillRect(0, 0, width, height);

      // Swirling nebula clouds
      const neb1 = ctx.createRadialGradient(120, 120, 10, 120, 120, 140);
      neb1.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      neb1.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(240, 240, 10, 240, 240, 150);
      neb2.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      neb2.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // Orbital planetary rings
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, 90, 45, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      // Twinkling stars
      const starPos = [
        [70, 90], [290, 70], [80, 270], [280, 290],
        [140, 60], [220, 310], [180, 120], [180, 240],
        [100, 180], [260, 180], [150, 220], [210, 140]
      ];
      starPos.forEach(([sx, sy], i) => {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#c084fc';
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (pType === 'ice_frost') {
      // Glacial Aurora & Frozen Boreal Ice Rink
      const iceGrad = ctx.createLinearGradient(0, 0, width, height);
      iceGrad.addColorStop(0, '#0284c7');
      iceGrad.addColorStop(0.5, '#0ea5e9');
      iceGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = iceGrad;
      ctx.fillRect(0, 0, width, height);

      // Aurora ribbons
      const auroraGrad = ctx.createRadialGradient(width / 2, 70, 10, width / 2, 70, 130);
      auroraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.55)');
      auroraGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height);

      // Ice skate arcs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (let r = 40; r <= 110; r += 24) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 3. Glowing Inner Rail on Canvas
    const railColor = '#' + (bg.palette.neonRailColor ? bg.palette.neonRailColor.toString(16).padStart(6, '0') : '00f0ff');
    ctx.shadowColor = railColor;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = railColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, width - 24, height - 24);
    ctx.shadowBlur = 0;

    // 4. Stopwatch Pill (Top)
    ctx.save();
    ctx.translate(width / 2, 54);
    ctx.fillStyle = bg.palette.stopwatchBg || '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-36, -11, 72, 22, 11);
    ctx.fill();
    ctx.strokeStyle = bg.palette.stopwatchBorder || 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = bg.palette.stopwatchText || '#ffffff';
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('08:38', 0, 1);
    ctx.restore();

    // 5. Floating Jackpot (Center)
    ctx.save();
    ctx.translate(width / 2, 120);
    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = bg.palette.jackpotShadow || 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = bg.palette.jackpotColor || '#ffffff';
    ctx.fillText('300 000 CR', 0, 0);
    ctx.restore();

    // 6. Scattered Thematic Particles
    const particles = bg.palette.particleColors || ['#ffffff'];
    for (let i = 0; i < 22; i++) {
      const px = 40 + Math.random() * (width - 80);
      const py = 40 + Math.random() * (height - 80);
      if (Math.hypot(px - width / 2, py - height / 2) < 40) continue;
      ctx.fillStyle = particles[i % particles.length];
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [bg]);

  // Frame and rail colors in hex
  const frameHex = '#' + (bg.palette.frameColor ? bg.palette.frameColor.toString(16).padStart(6, '0') : '24140e');
  const railHex = '#' + (bg.palette.neonRailColor ? bg.palette.neonRailColor.toString(16).padStart(6, '0') : '00f0ff');
  const lipHex = '#' + (bg.palette.innerLipColor ? bg.palette.innerLipColor.toString(16).padStart(6, '0') : '140a06');

  const handleMouseMove = (e) => {
    if (viewMode === 'topdown') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: 42 - y * 16,
      ry: x * 22,
      scale: 1.04,
    });
  };

  const handleMouseLeave = () => {
    if (viewMode === 'topdown') {
      setTilt({ rx: 0, ry: 0, scale: 1 });
    } else {
      setTilt({ rx: 42, ry: 0, scale: 1 });
    }
    setIsHovered(false);
  };

  const toggleViewMode = () => {
    const next = viewMode === 'isometric' ? 'topdown' : 'isometric';
    setViewMode(next);
    if (next === 'topdown') {
      setTilt({ rx: 0, ry: 0, scale: 1 });
    } else {
      setTilt({ rx: 42, ry: 0, scale: 1 });
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 3D Showcase Stage Viewport */}
      <div
        style={{
          width: '210px',
          height: '210px',
          borderRadius: '20px',
          background: `radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.5) 100%), ${bg.palette.floorGradStart || '#0f172a'}`,
          border: `2px solid ${railHex}44`,
          boxShadow: `0 12px 30px rgba(0, 0, 0, 0.35), 0 0 20px ${railHex}33`,
          perspective: '550px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'grab',
        }}
      >
        {/* Subtle floor grid backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            backgroundImage: `radial-gradient(circle, ${railHex}15 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            transform: 'rotate(45deg)',
            pointerEvents: 'none',
          }}
        />

        {/* 3D Transform Diamond Arena Container */}
        <div
          style={{
            width: '136px',
            height: '136px',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(45deg) scale(${tilt.scale})`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
            position: 'relative',
          }}
        >
          {/* 1. Ground contact drop-shadow under the tray */}
          <div
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: '24px',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 70%)',
              transform: 'translateZ(-20px)',
              pointerEvents: 'none',
            }}
          />

          {/* 2. Outer Luxury Tray Frame */}
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '16px',
              background: frameHex,
              border: `2px solid ${railHex}88`,
              boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.25)`,
              transform: 'translateZ(-4px)',
            }}
          />

          {/* 3. Deep Beveled Shadow Lip */}
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '10px',
              background: lipHex,
              transform: 'translateZ(-1px)',
            }}
          />

          {/* 4. Glowing 3D Neon Rail */}
          <div
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: '6px',
              border: `3px solid ${railHex}`,
              boxShadow: `0 0 16px ${railHex}, inset 0 0 10px ${railHex}88`,
              transform: 'translateZ(6px)',
              pointerEvents: 'none',
            }}
          />

          {/* 5. Central Pitch Canvas */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              transform: 'translateZ(2px)',
              boxShadow: 'inset 0 0 14px rgba(0,0,0,0.4)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          {/* 6. Center 3D Space Credit Stack Miniature */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '28px',
              height: '28px',
              transform: 'translate(-50%, -50%) translateZ(12px) rotateZ(-45deg)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                border: '1.5px solid #fef08a',
                boxShadow: '0 4px 10px rgba(0,0,0,0.4), 0 0 10px rgba(251, 191, 36, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
              }}
            >
              🪐
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pill */}
        <button
          onClick={toggleViewMode}
          title={viewMode === 'isometric' ? 'Switch to Top-Down 2D View' : 'Switch to 3D Isometric View'}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${railHex}66`,
            color: '#bae6fd',
            borderRadius: '10px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Compass size={11} color={railHex} />
          <span>{viewMode === 'isometric' ? '3D VIEW' : '2D TOP'}</span>
        </button>

        {/* Interactive Tilt Hint */}
        {viewMode === 'isometric' && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '8px',
              padding: '2px 6px',
              fontSize: '9px',
              fontWeight: 800,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              pointerEvents: 'none',
            }}
          >
            <Sparkles size={10} color={railHex} />
            <span>HOVER TO TILT</span>
          </div>
        )}
      </div>
    </div>
  );
}
