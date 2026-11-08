'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function ScreenShakeWrapper({ shakeTrigger, intensity = 'heavy', children }) {
  const [transform, setTransform] = useState('none');
  const animRef = useRef(null);

  const performShake = useCallback((shakeIntensity) => {
    // Check if screen shake is enabled
    if (typeof window !== 'undefined') {
      const isEnabled = localStorage.getItem('ngg_screen_shake_enabled');
      if (isEnabled === 'false') return;
    }

    if (animRef.current) cancelAnimationFrame(animRef.current);

    let startTime = performance.now();
    const duration = shakeIntensity === 'heavy' ? 2400 : 1400;
    const maxOffset = shakeIntensity === 'heavy' ? 22 : 12;
    const maxRot = shakeIntensity === 'heavy' ? 3.5 : 1.8;

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
  }, []);

  // Normal shake trigger
  useEffect(() => {
    if (!shakeTrigger) return;
    performShake(intensity);
  }, [shakeTrigger, intensity, performShake]);

  // Support test shake from Settings menu
  useEffect(() => {
    const handleTestShake = (e) => {
      const testIntensity = e?.detail?.intensity || 'heavy';
      performShake(testIntensity);
    };

    window.addEventListener('ngg_test_shake', handleTestShake);
    return () => {
      window.removeEventListener('ngg_test_shake', handleTestShake);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [performShake]);

  return (
    <div style={{
      transform,
      transition: transform === 'none' ? 'transform 0.1s ease-out' : 'none',
      width: '100%',
      height: '100%',
      willChange: transform === 'none' ? 'auto' : 'transform',
    }}>
      {children}
    </div>
  );
}
