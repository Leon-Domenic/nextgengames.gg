'use client';

import React from 'react';

// Crisp, lightweight vector SVG national flags for 100% reliable rendering on all platforms (Windows, macOS, Linux, iOS, Android)
export default function CountryFlag({
  country,
  code,
  width = 24,
  height = 16,
  style = {},
  className = '',
}) {
  const query = (country || code || '').toLowerCase().trim();
  let c = 'un';

  if (query.includes('egypt') || query === 'eg' || query === '🇪🇬') c = 'eg';
  else if (query.includes('poland') || query.includes('polska') || query === 'pl' || query === '🇵🇱') c = 'pl';
  else if (query.includes('czech') || query === 'cz' || query === '🇨🇿') c = 'cz';
  else if (query.includes('cyprus') || query === 'cy' || query === '🇨🇾') c = 'cy';
  else if (query.includes('austria') || query === 'at' || query === '🇦🇹') c = 'at';
  else if (query.includes('spain') || query === 'es' || query === '🇪🇸') c = 'es';
  else if (query.includes('ital') || query === 'it' || query === '🇮🇹') c = 'it';
  else if (query.includes('german') || query === 'de' || query === '🇩🇪') c = 'de';
  else if (query.includes('netherland') || query.includes('holland') || query === 'nl' || query === '🇳🇱') c = 'nl';
  else if (query.includes('uk') || query.includes('britain') || query === 'gb' || query === '🇬🇧') c = 'gb';
  else if (query.includes('france') || query === 'fr' || query === '🇫🇷') c = 'fr';
  else if (query.includes('uae') || query.includes('emirates') || query === 'ae' || query === '🇦🇪') c = 'ae';
  else if (query.includes('japan') || query === 'jp' || query === '🇯🇵') c = 'jp';
  else if (query.includes('korea') || query === 'kr' || query === '🇰🇷') c = 'kr';
  else if (query.includes('singapore') || query === 'sg' || query === '🇸🇬') c = 'sg';
  else if (query.includes('maldives') || query === 'mv' || query === '🇲🇻') c = 'mv';
  else if (query.includes('australia') || query === 'au' || query === '🇦🇺') c = 'au';
  else if (query.includes('usa') || query.includes('united states') || query === 'us' || query === '🇺🇸') c = 'us';
  else if (query.includes('russia') || query === 'ru' || query === '🇷🇺') c = 'ru';
  else if (query.includes('saudi') || query.includes('arab') || query === 'sa' || query === '🇸🇦') c = 'sa';

  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  return (
    <span
      className={`inline-flex items-center justify-center align-middle overflow-hidden rounded-[3px] shadow-sm border border-slate-700/60 shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
        display: 'inline-flex',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 32 20"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'hidden' }}
      >
        {c === 'eg' && (
          <>
            <rect width="32" height="6.66" fill="#ce1126" />
            <rect y="6.66" width="32" height="6.66" fill="#ffffff" />
            <rect y="13.33" width="32" height="6.66" fill="#000000" />
            <ellipse cx="16" cy="10" rx="2.5" ry="1.8" fill="#c09a35" />
          </>
        )}
        {c === 'pl' && (
          <>
            <rect width="32" height="10" fill="#ffffff" />
            <rect y="10" width="32" height="10" fill="#dc2626" />
          </>
        )}
        {c === 'cz' && (
          <>
            <rect width="32" height="10" fill="#ffffff" />
            <rect y="10" width="32" height="10" fill="#d7141a" />
            <polygon points="0,0 15,10 0,20" fill="#11457e" />
          </>
        )}
        {c === 'cy' && (
          <>
            <rect width="32" height="20" fill="#ffffff" />
            <ellipse cx="16" cy="8.5" rx="9" ry="4.5" fill="#d97706" />
            <path d="M 9,14.5 Q 16,18 23,14.5" stroke="#15803d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </>
        )}
        {c === 'at' && (
          <>
            <rect width="32" height="20" fill="#dc2626" />
            <rect y="6.66" width="32" height="6.66" fill="#ffffff" />
          </>
        )}
        {c === 'es' && (
          <>
            <rect width="32" height="20" fill="#b91c1c" />
            <rect y="5" width="32" height="10" fill="#facc15" />
            <circle cx="8" cy="10" r="2.8" fill="#dc2626" />
          </>
        )}
        {c === 'it' && (
          <>
            <rect x="0" width="10.66" height="20" fill="#16a34a" />
            <rect x="10.66" width="10.66" height="20" fill="#ffffff" />
            <rect x="21.32" width="10.66" height="20" fill="#dc2626" />
          </>
        )}
        {c === 'de' && (
          <>
            <rect width="32" height="6.66" fill="#0f172a" />
            <rect y="6.66" width="32" height="6.66" fill="#dc2626" />
            <rect y="13.32" width="32" height="6.66" fill="#facc15" />
          </>
        )}
        {c === 'nl' && (
          <>
            <rect width="32" height="6.66" fill="#dc2626" />
            <rect y="6.66" width="32" height="6.66" fill="#ffffff" />
            <rect y="13.32" width="32" height="6.66" fill="#1d4ed8" />
          </>
        )}
        {c === 'gb' && (
          <>
            <rect width="32" height="20" fill="#1e3a8a" />
            <line x1="0" y1="0" x2="32" y2="20" stroke="#ffffff" strokeWidth="4.5" />
            <line x1="32" y1="0" x2="0" y2="20" stroke="#ffffff" strokeWidth="4.5" />
            <line x1="0" y1="0" x2="32" y2="20" stroke="#dc2626" strokeWidth="2.2" />
            <line x1="32" y1="0" x2="0" y2="20" stroke="#dc2626" strokeWidth="2.2" />
            <rect x="13" width="6" height="20" fill="#ffffff" />
            <rect y="7" width="32" height="6" fill="#ffffff" />
            <rect x="14.2" width="3.6" height="20" fill="#dc2626" />
            <rect y="8.2" width="32" height="3.6" fill="#dc2626" />
          </>
        )}
        {c === 'fr' && (
          <>
            <rect x="0" width="10.66" height="20" fill="#1d4ed8" />
            <rect x="10.66" width="10.66" height="20" fill="#ffffff" />
            <rect x="21.32" width="10.66" height="20" fill="#dc2626" />
          </>
        )}
        {c === 'ae' && (
          <>
            <rect x="8" width="24" height="6.66" fill="#16a34a" />
            <rect x="8" y="6.66" width="24" height="6.66" fill="#ffffff" />
            <rect x="8" y="13.32" width="24" height="6.66" fill="#0f172a" />
            <rect x="0" width="8" height="20" fill="#dc2626" />
          </>
        )}
        {c === 'jp' && (
          <>
            <rect width="32" height="20" fill="#ffffff" />
            <circle cx="16" cy="10" r="5.5" fill="#dc2626" />
          </>
        )}
        {c === 'kr' && (
          <>
            <rect width="32" height="20" fill="#ffffff" />
            <path d="M 16,5 A 5,5 0 0,1 16,15 A 2.5,2.5 0 0,1 16,10 A 2.5,2.5 0 0,0 16,5 Z" fill="#dc2626" />
            <path d="M 16,5 A 5,5 0 0,0 16,15 A 2.5,2.5 0 0,1 16,10 A 2.5,2.5 0 0,0 16,5 Z" fill="#1d4ed8" />
          </>
        )}
        {c === 'sg' && (
          <>
            <rect width="32" height="10" fill="#dc2626" />
            <rect y="10" width="32" height="10" fill="#ffffff" />
            <circle cx="7" cy="5" r="3.2" fill="#ffffff" />
            <circle cx="8" cy="5" r="2.8" fill="#dc2626" />
          </>
        )}
        {c === 'mv' && (
          <>
            <rect width="32" height="20" fill="#dc2626" />
            <rect x="5" y="4" width="22" height="12" fill="#15803d" />
            <circle cx="16.5" cy="10" r="3.5" fill="#ffffff" />
            <circle cx="15.2" cy="10" r="3.1" fill="#15803d" />
          </>
        )}
        {c === 'au' && (
          <>
            <rect width="32" height="20" fill="#1e3a8a" />
            <rect width="14" height="9" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
            <circle cx="23" cy="5" r="1" fill="#ffffff" />
            <circle cx="27" cy="8" r="1" fill="#ffffff" />
            <circle cx="24" cy="13" r="1" fill="#ffffff" />
            <circle cx="20" cy="10" r="1" fill="#ffffff" />
            <circle cx="8" cy="15" r="1.5" fill="#ffffff" />
          </>
        )}
        {c === 'us' && (
          <>
            <rect width="32" height="20" fill="#ffffff" />
            <rect y="0" width="32" height="3" fill="#b91c1c" />
            <rect y="5.6" width="32" height="3" fill="#b91c1c" />
            <rect y="11.2" width="32" height="3" fill="#b91c1c" />
            <rect y="17" width="32" height="3" fill="#b91c1c" />
            <rect width="14" height="11" fill="#1e3a8a" />
            <circle cx="4" cy="3.5" r="0.8" fill="#ffffff" />
            <circle cx="10" cy="3.5" r="0.8" fill="#ffffff" />
            <circle cx="7" cy="6" r="0.8" fill="#ffffff" />
            <circle cx="4" cy="8.5" r="0.8" fill="#ffffff" />
            <circle cx="10" cy="8.5" r="0.8" fill="#ffffff" />
          </>
        )}
        {c === 'ru' && (
          <>
            <rect width="32" height="6.66" fill="#ffffff" />
            <rect y="6.66" width="32" height="6.66" fill="#2563eb" />
            <rect y="13.32" width="32" height="6.66" fill="#dc2626" />
          </>
        )}
        {c === 'sa' && (
          <>
            <rect width="32" height="20" fill="#15803d" />
            <rect x="8" y="13" width="16" height="2" rx="0.5" fill="#ffffff" />
            <circle cx="16" cy="8" r="2.8" fill="#ffffff" />
          </>
        )}
        {c === 'un' && (
          <>
            <rect width="32" height="20" fill="#38bdf8" />
            <text x="16" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              {(code || country || '🌐').slice(0, 2).toUpperCase()}
            </text>
          </>
        )}
      </svg>
    </span>
  );
}
