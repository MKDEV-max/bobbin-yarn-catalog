import { Link } from 'react-router-dom';
import { Check, Heart, Plus } from 'lucide-react';
import { site } from '../config/site';
import { formatDate, formatKg, productSubtitle, productTitle, stockStatus, type Product } from '../data/catalog';
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

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { isFavorite, toggleFavorite, inRequest, addToRequest } = useStore();
  const toast = useToast();
  const status = stockStatus(p);
  const fav = isFavorite(p.id), added = inRequest(p.id);
  const title = productTitle(p);
  return (
    <article className="product-card fade-in" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <div className="pc-media" style={{ background: tint(p.hex) }}>
        <Bobbin hex={p.hex} type={p.yarnType} className="pc-bobbin" />
        <span className={`badge badge-${status.tone} pc-status`}>{status.label}</span>
        <button className="icon-btn pc-fav" type="button" aria-pressed={fav} aria-label={fav ? `Убрать из избранного: ${title}` : `В избранное: ${title}`}
          onClick={() => { toggleFavorite(p.id); toast.show(fav ? 'Убрано из избранного' : 'Добавлено в избранное'); }}>
          <Heart aria-hidden="true" fill={fav ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="pc-body">
        <h3 className="pc-title"><Link to={`/product/${p.id}`}>{title}</Link></h3>
        <p className="pc-color">
          <ColorChip hex={p.hex} size="sm" />
          {p.cardName ? <>Оттенок «{p.cardName}»{p.cardCode && <span className="muted"> · {p.cardCode}</span>}</> : <span className="muted">Образец на карте не найден</span>}
        </p>
        <dl className="pc-specs">
          <dt>Состав</dt><dd>{productSubtitle(p)}</dd>
          <dt>Толщина</dt><dd>{p.tex ? <>{p.tex} текс <span className="muted">(Nm ≈ {p.nm?.toLocaleString('ru-RU')})</span></> : <span className="muted">уточняется</span>}</dd>
          {p.bobbinWeightKg && <><dt>Бобина</dt><dd>{p.bobbinWeightKg} кг</dd></>}
          {site.stock.show && <><dt>Остаток</dt><dd>{formatKg(p.stock.kg)} <span className="muted">{p.stock.date ? `на ${formatDate(p.stock.date)}` : '(дата не указана)'}</span></dd></>}
        </dl>
        <p className="pc-price">{p.priceRub ? `${p.priceRub.toLocaleString('ru-RU')} ₽/кг` : 'Цена по запросу'}</p>
        <div className="pc-actions">
          <Link className="btn btn-outline btn-sm" to={`/product/${p.id}`}>Подробнее<span className="sr-only">: {title}</span></Link>
          <button className={`btn btn-sm ${added ? 'btn-outline' : 'btn-primary'}`} type="button" aria-pressed={added}
            onClick={() => { if (!added) { addToRequest(p.id); toast.show('Добавлено в заявку'); } }}>
            {added ? <><Check aria-hidden="true" />В заявке</> : <><Plus aria-hidden="true" />В заявку</>}
          </button>
        </div>
      </div>
    </article>
  );
}
