import { Check } from 'lucide-react';
import { catalogById, isLight, type CatalogColor, type Color } from '../data/catalog';

/*
 * Цветовой образец — ровная заливка цветом с карты расцветок (CSS background-color), не фото и не градиент-имитация.
 * Составной цвет («A+B», «Ассорти») — несколько ровных секторов из реальных оттенков составляющих.
 * Светлым оттенкам — тонкая нейтральная рамка. Цвет не определён — нейтральный знак «нет образца», без выдуманного оттенка.
 */

type Size = 'dot' | 'sm' | 'md' | 'lg' | 'fill';

/** Фон образца: один оттенок — сплошная заливка; несколько — равные сектора с чёткими границами */
function toneBackground(tones: string[]) {
  if (tones.length < 2) return { backgroundColor: tones[0] };
  const step = 100 / tones.length;
  const stops = tones.map((t, i) => `${t} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`).join(', ');
  return { backgroundImage: tones.length === 2 ? `linear-gradient(135deg, ${stops})` : `conic-gradient(${stops})` };
}

/**
 * Образец цвета. hex — один оттенок; tones — несколько (составной цвет).
 * label — название для подсказки при наведении и для скринридера (без него образец декоративный).
 */
export function ColorChip({ hex, tones, size = 'md', className = '', label }: { hex: string | null; tones?: string[]; size?: Size; className?: string; label?: string }) {
  const list = tones && tones.length ? tones : hex ? [hex] : [];
  const light = list.length > 0 && list.every((t) => isLight(t));
  const a11y = label ? { role: 'img' as const, 'aria-label': label, title: label } : { 'aria-hidden': true as const };
  return (
    <span className={`color-chip color-chip-${size}${light ? ' is-light' : ''}${list.length ? '' : ' is-unknown'}${list.length > 1 ? ' is-multi' : ''} ${className}`}
      style={list.length ? toneBackground(list) : undefined} {...a11y} />
  );
}

/** Подпись образца: название цвета + что изображено */
export function colorLabel(c: CatalogColor) {
  if (c.status === 'unverified') return `${c.name}: оттенок уточняется`;
  if (c.tones.length > 1) return `${c.name}: ${c.toneNames.join(', ')}`;
  return `Цвет «${c.name}»${c.code ? `, ${c.code}` : ''}`;
}

/** Образец цвета каталога — единый для карточек, фильтров, заявки, избранного и страницы цвета */
export function ColorMark({ c, size = 'md', className, decorative }: { c: CatalogColor; size?: Size; className?: string; decorative?: boolean }) {
  return <ColorChip hex={c.hex} tones={c.tones} size={size} className={className} label={decorative ? undefined : colorLabel(c)} />;
}

/** Образец в палитре: квадрат цвета + название и артикул */
export function ColorSwatch({ c, selected, onToggle, count, compact }: { c: Color; selected?: boolean; onToggle?: () => void; count?: number; compact?: boolean }) {
  const tones = catalogById.get(c.id)?.tones;   // мулине с карты — оттенки обеих нитей
  const body = (
    <>
      <span className="sw-color" title={c.name}>
        <ColorChip hex={c.hex} tones={tones} size="fill" />
        {selected && <span className="sw-check" aria-hidden="true"><Check /></span>}
      </span>
      {!compact && (
        <span className="sw-text">
          <b>{c.name}</b>
          <small>{c.code}{typeof count === 'number' && <> · {count ? `${count} поз.` : 'нет в остатках'}</>}</small>
        </span>
      )}
    </>
  );
  if (!onToggle) return <span className="swatch">{body}</span>;
  return (
    <button type="button" className="swatch" aria-pressed={!!selected} onClick={onToggle}
      aria-label={`${c.name}, артикул ${c.code}${typeof count === 'number' ? `, ${count ? count + ' позиций' : 'нет в остатках'}` : ''}`}>
      {body}
    </button>
  );
}
