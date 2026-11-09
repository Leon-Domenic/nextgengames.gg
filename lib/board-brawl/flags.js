// Board Brawl: High-Fidelity National Vector Flag Renderer
// Guaranteed 100% cross-platform flag rendering (bypasses Windows emoji limitation in HTML5 Canvas & WebKit)

export const COUNTRY_FLAG_CODES = {
  'Poland': 'pl',
  'Czechia': 'cz',
  'Cyprus': 'cy',
  'Austria': 'at',
  'Spain': 'es',
  'Italy': 'it',
  'Germany': 'de',
  'Netherlands': 'nl',
  'UK': 'gb',
  'France': 'fr',
  'UAE': 'ae',
  'Japan': 'jp',
  'South Korea': 'kr',
  'Singapore': 'sg',
  'Maldives': 'mv',
  'Australia': 'au',
  'USA': 'us',
  'Russia': 'ru',
  'Saudi Arabia': 'sa',
};

// Canvas 2D Vector Drawing for Three.js Texture Generation
export function drawVectorFlag(ctx, countryOrCode, x, y, width, height, radius = 6) {
  if (!ctx || !countryOrCode) return;

  const key = String(countryOrCode).trim().toLowerCase();
  let code = 'un';

  if (key.includes('poland') || key.includes('polska') || key === 'pl' || key === '🇵🇱') code = 'pl';
  else if (key.includes('czech') || key === 'cz' || key === '🇨🇿') code = 'cz';
  else if (key.includes('cyprus') || key === 'cy' || key === '🇨🇾') code = 'cy';
  else if (key.includes('austria') || key === 'at' || key === '🇦🇹') code = 'at';
  else if (key.includes('spain') || key === 'es' || key === '🇪🇸') code = 'es';
  else if (key.includes('ital') || key === 'it' || key === '🇮🇹') code = 'it';
  else if (key.includes('german') || key === 'de' || key === '🇩🇪') code = 'de';
  else if (key.includes('netherland') || key.includes('holland') || key === 'nl' || key === '🇳🇱') code = 'nl';
  else if (key.includes('uk') || key.includes('britain') || key === 'gb' || key === '🇬🇧') code = 'gb';
  else if (key.includes('france') || key === 'fr' || key === '🇫🇷') code = 'fr';
  else if (key.includes('uae') || key.includes('emirates') || key === 'ae' || key === '🇦🇪') code = 'ae';
  else if (key.includes('japan') || key === 'jp' || key === '🇯🇵') code = 'jp';
  else if (key.includes('korea') || key === 'kr' || key === '🇰🇷') code = 'kr';
  else if (key.includes('singapore') || key === 'sg' || key === '🇸🇬') code = 'sg';
  else if (key.includes('maldives') || key === 'mv' || key === '🇲🇻') code = 'mv';
  else if (key.includes('australia') || key === 'au' || key === '🇦🇺') code = 'au';
  else if (key.includes('usa') || key.includes('united states') || key === 'us' || key === '🇺🇸') code = 'us';
  else if (key.includes('russia') || key === 'ru' || key === '🇷🇺') code = 'ru';
  else if (key.includes('saudi') || key.includes('arab') || key === 'sa' || key === '🇸🇦') code = 'sa';

  ctx.save();

  // Create rounded rectangle clip
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.clip();

  const w = width;
  const h = height;

  switch (code) {
    case 'pl': {
      // Poland: White top half, Red bottom half
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h / 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y + h / 2, w, h / 2);
      break;
    }
    case 'cz': {
      // Czechia: White top, Red bottom, Blue triangle on hoist
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h / 2);
      ctx.fillStyle = '#d7141a';
      ctx.fillRect(x, y + h / 2, w, h / 2);
      ctx.fillStyle = '#11457e';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.48, y + h / 2);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'cy': {
      // Cyprus: White field, golden copper island silhouette & olive wreath
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      // Copper island shape
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.52, y + h * 0.42, w * 0.28, h * 0.2, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Olive wreath
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = Math.max(1.5, h * 0.06);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.72, w * 0.22, 0.8 * Math.PI, 0.2 * Math.PI, false);
      ctx.stroke();
      break;
    }
    case 'at': {
      // Austria: Red / White / Red horizontal triband
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + h / 3, w, h / 3);
      break;
    }
    case 'es': {
      // Spain: Red (1/4), Yellow (2/4), Red (1/4)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x, y + h * 0.25, w, h * 0.5);
      // Crest dot
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + w * 0.28, y + h * 0.5, h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'it': {
      // Italy: Green, White, Red vertical tricolor
      const cW = w / 3;
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x, y, cW, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cW, y, cW, h);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + cW * 2, y, cW, h);
      break;
    }
    case 'de': {
      // Germany: Black, Red, Gold horizontal triband
      const rH = h / 3;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, w, rH);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y + rH, w, rH);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x, y + rH * 2, w, rH);
      break;
    }
    case 'nl': {
      // Netherlands: Red, White, Blue horizontal triband
      const rH = h / 3;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, w, rH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + rH, w, rH);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x, y + rH * 2, w, rH);
      break;
    }
    case 'gb': {
      // UK Union Jack
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x, y, w, h);
      // White Saltire
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = h * 0.24;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
      ctx.stroke();
      // Red Saltire
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = h * 0.12;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
      ctx.stroke();
      // White Cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w / 2 - w * 0.12, y, w * 0.24, h);
      ctx.fillRect(x, y + h / 2 - h * 0.15, w, h * 0.3);
      // Red Cross
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + w / 2 - w * 0.07, y, w * 0.14, h);
      ctx.fillRect(x, y + h / 2 - h * 0.09, w, h * 0.18);
      break;
    }
    case 'fr': {
      // France: Blue, White, Red vertical tricolor
      const cW = w / 3;
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x, y, cW, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cW, y, cW, h);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + cW * 2, y, cW, h);
      break;
    }
    case 'ae': {
      // UAE: Red vertical hoist, Green / White / Black horizontal
      const hoistW = w * 0.26;
      const stripeH = h / 3;
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x + hoistW, y, w - hoistW, stripeH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + hoistW, y + stripeH, w - hoistW, stripeH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + hoistW, y + stripeH * 2, w - hoistW, stripeH);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, hoistW, h);
      break;
    }
    case 'jp': {
      // Japan: White field with Crimson Sun in center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, h * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'kr': {
      // South Korea: White field with red/blue Taegeuk
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = h * 0.26;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0, false);
      ctx.fill();
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI, false);
      ctx.fill();
      // S-curve center
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - r / 2, cy, r / 2, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(cx + r / 2, cy, r / 2, 0, Math.PI * 2, false);
      ctx.fill();
      break;
    }
    case 'sg': {
      // Singapore: Red top, White bottom with white crescent
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, w, h / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + h / 2, w, h / 2);
      // Crescent
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + w * 0.24, y + h * 0.25, h * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + w * 0.28, y + h * 0.25, h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mv': {
      // Maldives: Red border, Green rectangle in center, white crescent
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, w, h);
      const bW = w * 0.16;
      const bH = h * 0.2;
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x + bW, y + bH, w - bW * 2, h - bH * 2);
      // White Crescent
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + w * 0.52, y + h * 0.5, h * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(x + w * 0.48, y + h * 0.5, h * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'au': {
      // Australia: Blue field, mini Union Jack canton, Southern Cross stars
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x, y, w, h);
      // Mini Canton
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, w * 0.45, h * 0.48);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w * 0.45, h * 0.48);
      // White Stars
      ctx.fillStyle = '#ffffff';
      const stars = [
        [0.72, 0.25], [0.85, 0.42], [0.75, 0.65], [0.65, 0.48], [0.72, 0.44], [0.28, 0.75]
      ];
      stars.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(x + w * sx, y + h * sy, Math.max(1.5, h * 0.04), 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'us': {
      // USA: 13 Red/White stripes, Blue canton
      const sH = h / 7; // simplified 7 visible bands
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#b91c1c' : '#ffffff';
        ctx.fillRect(x, y + i * sH, w, sH + 1);
      }
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x, y, w * 0.44, h * 0.56);
      // Small white star dots
      ctx.fillStyle = '#ffffff';
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.beginPath();
          ctx.arc(x + w * (0.08 + col * 0.12), y + h * (0.1 + row * 0.16), 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'ru': {
      // Russia: White, Blue, Red
      const rH = h / 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, rH);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(x, y + rH, w, rH);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y + rH * 2, w, rH);
      break;
    }
    case 'sa': {
      // Saudi Arabia: Emerald Green with white emblem
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w * 0.25, y + h * 0.68, w * 0.5, h * 0.08); // stylized sword
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.42, h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.round(h * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(code.toUpperCase(), x + w / 2, y + h / 2);
      break;
    }
  }

  // Elegant golden/dark metallic border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(1.5, h * 0.05);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.stroke();

  ctx.restore();
}
