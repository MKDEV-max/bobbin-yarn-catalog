/*
 * Иллюстрация бобины в цвете образца. Это не фотография товара:
 * цвет приблизительный (замер с фото карты расцветок), рядом всегда показывается реальный образец.
 */
import { useId } from 'react';

type Props = { hex: string | null; type?: string | null; size?: number; className?: string; title?: string };

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function Bobbin({ hex, type, className, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const known = !!hex;
  const base = hex ?? '#D9D2C2';
  const light = shade(base, 1.18), dark = shade(base, 0.72);
  const melange = type === 'melange', multi = type === 'mouline';
  return (
    <svg className={className} viewBox="0 0 200 220" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <pattern id={`w${uid}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          <rect width="9" height="9" fill={base} />
          <path d="M0 4.5h9" stroke={multi ? shade(base, 0.45) : dark} strokeWidth={multi ? 3 : 1.6} opacity={multi ? 0.9 : 0.55} />
          {melange && <><circle cx="2" cy="2" r="1.1" fill={light} /><circle cx="6.5" cy="7" r="1" fill={dark} /></>}
        </pattern>
        <linearGradient id={`g${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset=".42" stopColor="#fff" stopOpacity=".2" />
          <stop offset="1" stopColor="#000" stopOpacity=".34" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="204" rx="74" ry="9" fill="#000" opacity=".12" />
      <path d="M72 40 L128 40 L162 192 Q100 208 38 192 Z" fill={`url(#w${uid})`} stroke={known ? 'none' : '#988A71'} strokeDasharray={known ? undefined : '5 4'} strokeWidth="1.5" />
      <path d="M72 40 L128 40 L162 192 Q100 208 38 192 Z" fill={`url(#g${uid})`} />
      <ellipse cx="100" cy="40" rx="28" ry="6" fill={shade(base, 0.9)} />
      <rect x="90" y="14" width="20" height="28" rx="2" fill="#C9B796" />
      <ellipse cx="100" cy="14" rx="10" ry="3" fill="#8E7B5E" />
      {!known && <text x="100" y="130" textAnchor="middle" fontSize="40" fontWeight="700" fill="#6B5A40" fontFamily="Manrope, sans-serif">?</text>}
    </svg>
  );
}
