import { Check } from 'lucide-react';
import { isLight, type Color } from '../data/catalog';

/*
 * Цветовой образец — однотонный квадрат (CSS background-color по HEX из данных карты расцветок).
 * Не фотография мотка и не градиент. Светлым оттенкам добавляется тонкая рамка.
 */

/** Однотонный квадрат цвета. hex = null — цвет неизвестен (пунктирная рамка) */
export function ColorChip({ hex, size = 'md', className = '' }: { hex: string | null; size?: 'sm' | 'md' | 'lg' | 'fill'; className?: string }) {
  return (
    <span className={`color-chip color-chip-${size}${hex && isLight(hex) ? ' is-light' : ''}${hex ? '' : ' is-unknown'} ${className}`}
      style={hex ? { backgroundColor: hex } : undefined} aria-hidden="true" />
  );
}

/** Образец в палитре: квадрат цвета + название и артикул */
export function ColorSwatch({ c, selected, onToggle, count, compact }: { c: Color; selected?: boolean; onToggle?: () => void; count?: number; compact?: boolean }) {
  const body = (
    <>
      <span className="sw-color">
        <ColorChip hex={c.hex} size="fill" />
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
