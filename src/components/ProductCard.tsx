import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { capName, type CatalogColor } from '../data/catalog';
import type { CompId, Twist } from '../data/variants';
import { useStore, useToast } from '../state/store';
import { Bobbin } from './Bobbin';
import { ColorChip } from './ColorSwatch';
import { Configurator } from './Configurator';

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

/** Светлый фон под бобиной — из цвета самой пряжи */
export function tint(hex: string | null, k = 0.86) {
  if (!hex) return 'var(--color-surface-alt)';
  const n = parseInt(hex.slice(1), 16), m = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`;
}

/*
 * Карточка цвета: одна на цвет. Внутри — выбор одной из 8 конфигураций (скрутка × состав).
 * Изображение — иллюстрация бобины в цвете образца (фото бобин в проекте нет); образец цвета — однотонный.
 */
export function ProductCard({ c, index = 0, twist = null, comp = null }: { c: CatalogColor; index?: number; twist?: Twist | null; comp?: CompId | null }) {
  const { isFavorite, toggleFavorite } = useStore();
  const toast = useToast();
  const fav = isFavorite(c.id);
  const name = capName(c.name.trim());
  return (
    <article className="product-card fade-in" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <Link to={`/product/${c.id}`} className="pc-media" style={{ background: tint(c.hex) }} tabIndex={-1} aria-hidden="true">
        <Bobbin hex={c.hex} type={c.type} className="pc-bobbin" />
      </Link>
      <div className="pc-body">
        <h3 className="pc-title">
          <Link to={`/product/${c.id}`} className="pc-name">
            <ColorChip hex={c.hex} size="md" className="pc-chip" />
            <span><span className="pc-name-text">{name}</span><small>{c.code ? `арт. ${c.code}` : 'без образца на карте'}</small></span>
          </Link>
        </h3>
        <Configurator color={c} initialTwist={twist} initialComp={comp} compact detailsLink />
      </div>
      <button className="pc-fav" type="button" aria-pressed={fav} aria-label={fav ? `Убрать из избранного: ${name}` : `В избранное: ${name}`}
        onClick={() => { toggleFavorite(c.id); toast.show(fav ? 'Убрано из избранного' : 'Добавлено в избранное'); }}>
        <Heart aria-hidden="true" fill={fav ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
