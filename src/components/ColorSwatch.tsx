import { Check } from 'lucide-react';
import type { Color } from '../data/catalog';
import { asset } from './ProductCard';

/** Образец цвета: фото мотка с карты расцветок + полоса приблизительного цвета */
export function ColorSwatch({ c, selected, onToggle, count, compact }: { c: Color; selected?: boolean; onToggle?: () => void; count?: number; compact?: boolean }) {
  const body = (
    <>
      <span className="sw-img">
        <img src={asset(c.swatch)} width={220} height={99} alt="" loading="lazy" decoding="async" />
        {selected && <span className="sw-check" aria-hidden="true"><Check /></span>}
      </span>
      <span className="sw-bar" style={{ background: c.hex }} aria-hidden="true" />
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
