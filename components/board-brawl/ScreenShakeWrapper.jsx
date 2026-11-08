'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function ScreenShakeWrapper({ shakeTrigger, intensity = 'heavy', children }) {
  const [transform, setTransform] = useState('none');
  const animRef = useRef(null);

  useEffect(() => {
    if (!shakeTrigger) return;

    let startTime = performance.now();
    const duration = intensity === 'heavy' ? 2400 : 1400;
    const maxOffset = intensity === 'heavy' ? 22 : 12;
    const maxRot = intensity === 'heavy' ? 3.5 : 1.8;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        // Damped spring exponential decay
        const decay = Math.exp(-progress * 3.5);
        const offsetX = (Math.random() * 2 - 1) * maxOffset * decay;
        const offsetY = (Math.random() * 2 - 1) * maxOffset * decay;
        const rot = (Math.random() * 2 - 1) * maxRot * decay;

        setTransform(`translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`);
        animRef.current = requestAnimationFrame(animate);
      } else {
        setTransform('none');
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [shakeTrigger, intensity]);

  return (
    <div style={{
      transform,
      transition: transform === 'none' ? 'transform 0.1s ease-out' : 'none',
      width: '100%',
      height: '100%',
      willChange: 'transform',
    }}>
      {children}
    </div>
  );
}
