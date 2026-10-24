import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ClipboardPlus, Heart, Palette, Plus } from 'lucide-react';
import { Seo } from '../components/Seo';
import { Bobbin } from '../components/Bobbin';
import { ProductCard, asset, tint } from '../components/ProductCard';
import { site } from '../config/site';
import { PRODUCTS, colorById, formatDate, formatKg, hueOf, labels, productById, productSubtitle, productTitle, stockStatus } from '../data/catalog';
import { useStore, useToast } from '../state/store';
import { NotFoundPage } from './NotFoundPage';

const TYPE: Record<string, string> = { solid: 'Однотонная', melange: 'Меланжевая', mouline: 'Мулинированная (из нитей разных цветов)' };
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[\s.]/g, '');

export function ProductPage() {
  const { id = '' } = useParams();
  const p = productById.get(id);
  const { isFavorite, toggleFavorite, inRequest, addToRequest, updateItem } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  if (!p) return <NotFoundPage />;

  const color = p.colorId ? colorById.get(p.colorId) : null;
  const title = productTitle(p);
  const status = stockStatus(p);
  const fav = isFavorite(p.id), added = inRequest(p.id);
  const unknown = <span className="muted">уточняется</span>;

  // Тот же цвет в других составах / толщинах
  const variants = PRODUCTS.filter((q) => q.id !== p.id && ((p.colorId && q.colorId === p.colorId) || norm(q.colorName) === norm(p.colorName)));
  // Похожие оттенки: тот же состав, та же группа, ближайшие по тону
  const similar = PRODUCTS.filter((q) => q.id !== p.id && !variants.includes(q) && q.composition === p.composition && q.groups.some((g) => p.groups.includes(g)))
    .sort((a, b) => Math.abs(hueOf(a.hex) - hueOf(p.hex)) - Math.abs(hueOf(b.hex) - hueOf(p.hex))).slice(0, 4);

  const requestSample = () => {
    addToRequest(p.id);
    updateItem(p.id, { comment: 'Нужен образец' });
    navigate('/request');
  };

  return (
    <>
      <Seo title={`${title} — ${productSubtitle(p)}`} description={`${title}: ${productSubtitle(p)}${p.tex ? `, ${p.tex} текс` : ''}. Пряжа на бобинах${p.purpose.includes('machine') ? ' для машинного вязания' : ''}, образец цвета, остаток по данным склада. Цена по запросу.`} />
      <div className="page-head page-head-compact">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/">Главная</Link></li><li><Link to="/catalog">Каталог</Link></li><li aria-current="page">{title}</li></ol></nav>
        </div>
      </div>

      <section className="section product" style={{ paddingTop: 'var(--space-5)' }}>
        <div className="container product-grid-2">
          <div className="gallery">
            <div className="gallery-main" style={{ background: tint(p.hex, 0.8) }}>
              <Bobbin hex={p.hex} type={p.yarnType} className="gallery-bobbin" title={`Иллюстрация бобины в цвете «${p.cardName ?? p.colorName}»`} />
              <span className="badge badge-dark gallery-note">Иллюстрация, цвет приблизительный</span>
            </div>
            {color ? (
              <figure className="gallery-swatch">
                <img src={asset(color.swatch)} width={220} height={99} alt={`Моток «${color.name}» на карте расцветок`} />
                <figcaption><b>Образец с карты расцветок</b><span>«{color.name}», артикул {color.code}</span><span className="muted">≈ {color.hex} — приблизительно</span></figcaption>
              </figure>
            ) : <p className="alert alert-warm">Образец этого оттенка на карте расцветок не найден. Уточните цвет у менеджера или запросите образец.</p>}
          </div>

          <div className="product-info">
            <span className={`badge badge-${status.tone}`}>{status.label}</span>
            <h1>{title}</h1>
            <p className="product-sub">{productSubtitle(p)}{p.purpose.includes('machine') ? ' · для машинного вязания' : ''}</p>
            <p className="product-price">{p.priceRub ? `${p.priceRub.toLocaleString('ru-RU')} ₽/кг` : 'Цена по запросу'}</p>

            <div className="product-actions">
              <button className={`btn ${added ? 'btn-outline' : 'btn-primary'}`} type="button" aria-pressed={added} onClick={() => { if (!added) { addToRequest(p.id); toast.show('Добавлено в заявку'); } else navigate('/request'); }}>
                {added ? <><Check aria-hidden="true" />В заявке — открыть</> : <><Plus aria-hidden="true" />В заявку</>}
              </button>
              <button className="btn btn-outline" type="button" onClick={requestSample}><ClipboardPlus aria-hidden="true" />Запросить образец</button>
              <button className="icon-btn" type="button" aria-pressed={fav} aria-label={fav ? 'Убрать из избранного' : 'В избранное'} onClick={() => { toggleFavorite(p.id); toast.show(fav ? 'Убрано из избранного' : 'Добавлено в избранное'); }}>
                <Heart aria-hidden="true" fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>

            <h2 className="h-small">Характеристики</h2>
            <dl className="spec-table">
              <dt>Оттенок (название на складе)</dt><dd>{p.colorName}</dd>
              <dt>Оттенок на карте расцветок</dt><dd>{p.cardName ? <>«{p.cardName}», артикул {p.cardCode}</> : unknown}</dd>
              <dt>Группа оттенка</dt><dd>{p.groups.length ? p.groups.map((g) => labels.group(g)).join(', ') : unknown}</dd>
              <dt>Состав</dt><dd>{p.composition ?? unknown}</dd>
              <dt>Тип нити</dt><dd>{p.yarnType ? TYPE[p.yarnType] : unknown}</dd>
              <dt>Линейная плотность</dt><dd>{p.tex ? `${p.tex} текс` : unknown}</dd>
              <dt>Номер Nm</dt><dd>{p.nm ? <>≈ {p.nm.toLocaleString('ru-RU')} <span className="muted">(расчёт: 1000 / текс)</span></> : unknown}</dd>
              <dt>Сложения</dt><dd>{p.ply ?? unknown}</dd>
              <dt>Масса бобины</dt><dd>{p.bobbinWeightKg ? `${p.bobbinWeightKg} кг` : unknown}</dd>
              <dt>Назначение</dt><dd>{p.purpose.length ? p.purpose.map((x) => labels.purpose(x)).join(', ') : unknown}</dd>
              <dt>Минимальная партия</dt><dd>{p.minOrder ?? unknown}</dd>
              {site.stock.show && <><dt>Остаток на складе</dt><dd>{formatKg(p.stock.kg)} {p.stock.date ? <span className="muted">по данным на {formatDate(p.stock.date)}</span> : <span className="muted">(дата в таблице не указана)</span>}</dd></>}
            </dl>
            {site.stock.show && <p className="hint">Остаток — общая масса этого цвета на складе по таблице остатков, а не масса одной бобины. Перед заказом уточняйте наличие.</p>}

            {p.assorti && (
              <div className="assorti">
                <h2 className="h-small">Из каких цветов состоит «Ассорти»</h2>
                <ul className="tag-list">{p.assorti.map((n) => <li key={n}>{n}</li>)}</ul>
              </div>
            )}
            {p.notes.length > 0 && <ul className="notes">{p.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            <Link className="btn btn-ghost" to={color ? `/colors?pick=${color.id}` : '/colors'}><Palette aria-hidden="true" />Подобрать сочетания на палитре</Link>
          </div>
        </div>
      </section>

      {variants.length > 0 && (
        <section className="section section-alt" aria-labelledby="var-title">
          <div className="container">
            <div className="section-head"><h2 id="var-title">Этот оттенок в других вариантах</h2><p>Другие составы или толщины с тем же цветом.</p></div>
            <div className="product-grid">{variants.map((q, i) => <ProductCard key={q.id} p={q} index={i} />)}</div>
          </div>
        </section>
      )}
      {similar.length > 0 && (
        <section className="section" aria-labelledby="sim-title">
          <div className="container">
            <div className="section-head"><h2 id="sim-title">Похожие оттенки</h2><p>Тот же состав, близкие цвета.</p></div>
            <div className="product-grid">{similar.map((q, i) => <ProductCard key={q.id} p={q} index={i} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
