import { Link } from 'react-router-dom';
import { Check, Heart, Plus } from 'lucide-react';
import { materialShort, productTitle, type Product } from '../data/catalog';
import { useStore, useToast } from '../state/store';
import { Bobbin } from './Bobbin';
import { ColorChip } from './ColorSwatch';

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

/** Светлый фон под бобиной — из цвета самой пряжи */
export function tint(hex: string | null, k = 0.86) {
  if (!hex) return 'var(--color-surface-alt)';
  const n = parseInt(hex.slice(1), 16), m = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/*
 * Карточка — только главное: изображение бобины, вид пряжи, цвет, состав (если известен), цена и «В заявку».
 * Толщина, остатки, назначение и прочие характеристики — на странице товара (вся карточка ведёт туда).
 */
export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { isFavorite, toggleFavorite, inRequest, addToRequest } = useStore();
  const toast = useToast();
  const fav = isFavorite(p.id), added = inRequest(p.id);
  const title = productTitle(p);
  const colorName = cap((p.cardName ?? p.colorName).trim());
  return (
    <article className="product-card fade-in" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <div className="pc-media" style={{ background: tint(p.hex) }}>
        <Bobbin hex={p.hex} type={p.yarnType} className="pc-bobbin" />
      </div>
      <div className="pc-body">
        <p className="pc-kind">{materialShort(p)}{p.tex ? `, ${p.tex} текс` : ''}</p>
        <h3 className="pc-title">
          <Link to={`/product/${p.id}`} className="pc-link" title={title}>
            <ColorChip hex={p.hex} size="sm" /><span>{colorName}</span>
          </Link>
        </h3>
        {p.composition && <p className="pc-comp">{p.composition}</p>}
        <p className="pc-price">{p.priceRub ? `${p.priceRub.toLocaleString('ru-RU')} ₽/кг` : 'Цена по запросу'}</p>
        <button className={`btn btn-sm pc-add ${added ? 'btn-outline' : 'btn-primary'}`} type="button" aria-pressed={added}
          aria-label={added ? `В заявке: ${title}` : `В заявку: ${title}`}
          onClick={() => { if (!added) { addToRequest(p.id); toast.show('Добавлено в заявку'); } }}>
          {added ? <><Check aria-hidden="true" />В заявке</> : <><Plus aria-hidden="true" />В заявку</>}
        </button>
      </div>
      <button className="pc-fav" type="button" aria-pressed={fav} aria-label={fav ? `Убрать из избранного: ${title}` : `В избранное: ${title}`}
        onClick={() => { toggleFavorite(p.id); toast.show(fav ? 'Убрано из избранного' : 'Добавлено в избранное'); }}>
        <Heart aria-hidden="true" fill={fav ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
