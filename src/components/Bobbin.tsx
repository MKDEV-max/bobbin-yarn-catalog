/*
 * Иллюстрация бобины в цвете пряжи — одна SVG на все цвета, окраска из данных (hex / tones).
 * Это не фотография товара: если появится настоящее фото (CatalogColor.photo), показывается оно.
 * Крестовая намотка, объём (светотень по конусу), блик, гильза и тень — чтобы нить читалась как пряжа.
 * Цвет не определён — неокрашенный контурный набросок без выдуманного оттенка.
 */
import { useId } from 'react';

type Props = { hex: string | null; tones?: string[]; type?: string | null; size?: number; className?: string; title?: string };

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 1 ? c + (255 - c) * (k - 1) : c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

const CONE = 'M70 40 L130 40 L164 190 Q100 210 36 190 Z';

export function Bobbin({ hex, tones, type, className, title }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const list = tones && tones.length ? tones : hex ? [hex] : [];
  const a11y = title ? { role: 'img' as const, 'aria-label': title } : { 'aria-hidden': true as const };

  if (!list.length) {
    // Цвет не определён: контур бобины и витки нити без заливки цветом
    return (
      <svg className={className} viewBox="0 0 200 220" {...a11y}>
        <ellipse cx="100" cy="206" rx="70" ry="8" fill="#000" opacity=".08" />
        <path d={CONE} fill="#F4F1EA" stroke="#A9A293" strokeWidth="1.6" />
        {[60, 80, 100, 120, 140, 160, 178].map((y) => {
          const w = 30 + (y - 40) * 0.227;
          return <path key={y} d={`M${100 - w} ${y} Q100 ${y + 7} ${100 + w} ${y}`} fill="none" stroke="#C9C2B3" strokeWidth="1.2" />;
        })}
        <ellipse cx="100" cy="40" rx="30" ry="6.5" fill="#EAE5DA" stroke="#A9A293" strokeWidth="1.4" />
        <rect x="90" y="12" width="20" height="30" rx="2" fill="#E5D9C2" stroke="#A9A293" strokeWidth="1.2" />
        <ellipse cx="100" cy="12" rx="10" ry="3" fill="#CDBFA3" />
      </svg>
    );
  }

  const base = list[0];
  const multi = list.length > 1, melange = type === 'melange';
  const stripe = multi ? 1.6 : 4;   // ширина «нити» в узоре; у мулине нити тонко скручены — витки узкие
  return (
    <svg className={className} viewBox="0 0 200 220" {...a11y}>
      <defs>
        {/* Намотка в одну сторону: нить основного цвета (или чередование нитей составного цвета) */}
        <pattern id={`a${uid}`} width={stripe * Math.max(2, list.length)} height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
          {multi
            ? list.map((t, i) => <rect key={i} x={i * stripe} width={stripe} height="8" fill={t} />)
            : <><rect width={stripe * 2} height="8" fill={base} /><rect x={stripe} width="1" height="8" fill={shade(base, 0.7)} opacity=".55" /></>}
          {melange && <><circle cx="2" cy="2" r=".9" fill={shade(base, 1.45)} /><circle cx="6" cy="6" r=".8" fill={shade(base, 0.6)} /></>}
        </pattern>
        {/* Встречная намотка — ромбики крестовой намотки */}
        <pattern id={`b${uid}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(62)">
          <rect x="0" width="1.1" height="7" fill={shade(base, 1.35)} opacity=".45" />
        </pattern>
        {/* Объём конуса: темнее по краям, светлее у блика */}
        <linearGradient id={`g${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".38" />
          <stop offset=".3" stopColor="#000" stopOpacity=".05" />
          <stop offset=".42" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".04" />
          <stop offset="1" stopColor="#000" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={`v${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".85" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
        <clipPath id={`c${uid}`}><path d={CONE} /></clipPath>
      </defs>
      <ellipse cx="100" cy="206" rx="72" ry="9" fill="#000" opacity=".14" />
      {/* Гильза снизу */}
      <path d="M86 196 L114 196 L116 204 Q100 208 84 204 Z" fill="#C9B796" />
      <g clipPath={`url(#c${uid})`}>
        <path d={CONE} fill={base} />
        <path d={CONE} fill={`url(#a${uid})`} />
        <path d={CONE} fill={`url(#b${uid})`} />
        {/* Витки по окружности конуса */}
        {[58, 76, 94, 112, 130, 148, 166, 184].map((y) => {
          const w = 30 + (y - 40) * 0.227;
          return <path key={y} d={`M${100 - w} ${y} Q100 ${y + 8} ${100 + w} ${y}`} fill="none" stroke="#000" strokeOpacity=".07" strokeWidth="1.4" />;
        })}
        <path d={CONE} fill={`url(#g${uid})`} />
        <path d={CONE} fill={`url(#v${uid})`} />
      </g>
      {/* Торец намотки и гильза сверху */}
      <ellipse cx="100" cy="40" rx="30" ry="6.5" fill={shade(base, 0.82)} />
      <ellipse cx="100" cy="40" rx="30" ry="6.5" fill={`url(#a${uid})`} opacity=".6" />
      <ellipse cx="100" cy="40" rx="11" ry="2.6" fill="#8E7B5E" />
      <rect x="90" y="12" width="20" height="30" rx="2" fill="#D6C4A0" />
      <rect x="90" y="12" width="6" height="30" fill="#fff" opacity=".18" />
      <ellipse cx="100" cy="12" rx="10" ry="3" fill="#A8916C" />
      <ellipse cx="100" cy="12" rx="6" ry="1.7" fill="#6E5C42" />
    </svg>
  );
}
