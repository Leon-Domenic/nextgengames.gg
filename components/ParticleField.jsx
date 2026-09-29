'use client';

import { useEffect, useRef } from 'react';

export default function ParticleField({ count = 65, color = 'cyan' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle setup
    const particles = [];
    const colorRGB =
      color === 'red'
        ? { r: 255, g: 51, b: 68 }
        : color === 'green'
        ? { r: 16, g: 255, b: 136 }
        : { r: 0, g: 240, b: 255 };

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.45,
        speedY: -Math.random() * 0.85 - 0.25, // rising sparks
        opacity: Math.random() * 0.7 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.008;

        // Wrap around
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const currentOpacity = Math.max(0.1, Math.min(0.9, p.opacity));

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${currentOpacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, 0.8)`;
        ctx.fill();

        // Occasional connecting lines
        if (i % 5 === 0 && i < particles.length - 1) {
          const next = particles[i + 1];
          const dist = Math.hypot(p.x - next.x, p.y - next.y);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${
              0.15 * (1 - dist / 80)
            })`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
