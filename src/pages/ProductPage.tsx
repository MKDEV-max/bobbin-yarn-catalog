import { Link, Navigate, useParams } from 'react-router-dom';
import { Heart, Palette } from 'lucide-react';
import { Seo } from '../components/Seo';
import { BobbinImage } from '../components/BobbinImage';
import { ColorChip, ColorMark } from '../components/ColorSwatch';
import { Configurator } from '../components/Configurator';
import { ProductCard, tint } from '../components/ProductCard';
import { site } from '../config/site';
import { CATALOG, capName, catalogById, colorConfigs, formatDate, formatKg, hueOf, labels, legacyToColor, META } from '../data/catalog';
import { COMPOSITION_OPTIONS, TWISTS } from '../data/variants';
import { useStore, useToast } from '../state/store';
import { NotFoundPage } from './NotFoundPage';

const TYPE: Record<string, string> = { solid: 'Однотонная', melange: 'Меланжевая', mouline: 'Мулинированная (из нитей разных цветов)' };

/** Страница цвета: выбор конфигурации, все 8 вариантов, подробные сведения */
export function ProductPage() {
  const { id = '' } = useParams();
  const c = catalogById.get(id);
  const { isFavorite, toggleFavorite } = useStore();
  const toast = useToast();
  if (!c) {
    const to = legacyToColor.get(id);   // старая ссылка на позицию «цвет + состав» → страница цвета
    return to ? <Navigate to={`/product/${to}`} replace /> : <NotFoundPage />;
  }
  const name = capName(c.name.trim());
  const fav = isFavorite(c.id);
  const configs = colorConfigs(c);
  const similar = CATALOG.filter((x) => x.id !== c.id && x.hex && c.hex && x.groups.some((g) => c.groups.includes(g)))
    .sort((a, b) => Math.abs(hueOf(a.hex) - hueOf(c.hex)) - Math.abs(hueOf(b.hex) - hueOf(c.hex))).slice(0, 4);

  return (
    <>
      <Seo title={`Пряжа «${name}»${c.code ? ` ${c.code}` : ''} — скрутка 16/2 и 32/2`}
        description={`Бобинная пряжа цвета «${name}»${c.code ? `, артикул ${c.code}` : ''}: скрутка 16/2 или 32/2, состав 30% шерсть / 70% ПАН, 50/50, 100% ПАН или индивидуальный. Цена по запросу.`} />
      <div className="page-head-compact">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/">Главная</Link></li><li><Link to="/catalog">Каталог</Link></li><li aria-current="page">{name}</li></ol></nav>
        </div>
      </div>

      <section className="section product" style={{ paddingTop: 'var(--space-5)' }}>
        <div className="container product-grid-2">
          <div className="gallery">
            <div className="gallery-main" style={{ background: tint(c.hex, 0.8) }}>
              <BobbinImage c={c} className="gallery-bobbin" titled />
              <span className="badge badge-dark gallery-note">{c.photo ? 'Фото бобины' : c.status === 'unverified' ? 'Иллюстрация, цвет уточняется' : 'Иллюстрация, цвет приблизительный'}</span>
            </div>
            <figure className="gallery-swatch">
              <ColorMark c={c} size="lg" />
              <figcaption>
                <b>{c.status === 'unverified' ? 'Оттенок уточняется' : c.tones.length > 1 ? 'Составной цвет' : c.status === 'manual' ? 'Цвет подтверждён вручную' : 'Цвет по карте расцветок'}</b>
                <span>«{c.name}»{c.code && <>, артикул {c.code}</>}</span>
                {c.tones.length > 1 && <span className="tone-list">{c.tones.map((t, i) => <span key={i}><ColorChip hex={t} size="dot" />{c.toneNames[i]}</span>)}</span>}
                {c.tones.length === 1 && <span className="muted">{c.hex} — приблизительно, по фото карты</span>}
                {c.statusNote && <span className="muted">{c.statusNote}</span>}
                {c.status === 'unverified' && <span className="muted">Цвет уточните у менеджера или запросите образец.</span>}
              </figcaption>
            </figure>
          </div>

          <div className="product-info">
            <p className="pc-kind">Бобинная пряжа · {site.name}</p>
            <h1>{name}</h1>
            <p className="product-sub">{c.code ? `Артикул ${c.code}` : 'Цвет из таблицы остатков'}{c.groups.length > 0 && ` · ${c.groups.map((g) => labels.group(g)).join(', ')}`}</p>
            <div className="card cfg-card">
              <Configurator key={c.id} color={c} />
            </div>
            <button className="btn btn-ghost" type="button" aria-pressed={fav} onClick={() => { toggleFavorite(c.id); toast.show(fav ? 'Убрано из избранного' : 'Добавлено в избранное'); }}>
              <Heart aria-hidden="true" fill={fav ? 'currentColor' : 'none'} />{fav ? 'В избранном' : 'В избранное'}
            </button>

            <h2 className="h-small">Варианты этого цвета</h2>
            <div className="variants-table-wrap">
              <table className="variants-table">
                <caption className="sr-only">8 конфигураций цвета «{name}»: скрутка и состав</caption>
                <thead><tr><th scope="col">Состав</th>{TWISTS.map((t) => <th scope="col" key={t}>Скрутка {t}</th>)}</tr></thead>
                <tbody>
                  {COMPOSITION_OPTIONS.map((o) => (
                    <tr key={o.id}>
                      <th scope="row">{o.label}{o.note && <small>{o.note}</small>}</th>
                      {TWISTS.map((t) => {
                        const k = configs.find((x) => x.twist === t && x.comp === o.id)!;
                        return <td key={t}>{k.priceRub ? `${k.priceRub.toLocaleString('ru-RU')} ₽/кг` : 'По запросу'}{k.available === true && <small className="ok">в наличии</small>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">Цена и наличие каждой комбинации подтверждаются менеджером по заявке.</p>

            <h2 className="h-small">Характеристики</h2>
            <dl className="spec-table">
              <dt>Цвет</dt><dd>{c.name}</dd>
              <dt>Артикул на карте расцветок</dt><dd>{c.code ?? <span className="muted">нет образца на карте</span>}</dd>
              <dt>Тип нити</dt><dd>{c.type ? TYPE[c.type] : <span className="muted">уточняется</span>}</dd>
              <dt>Скрутка</dt><dd>16/2 или 32/2 — на выбор</dd>
              <dt>Состав</dt><dd>30% шерсть / 70% ПАН, 50% шерсть / 50% ПАН, 100% ПАН или индивидуальный</dd>
              <dt>Масса бобины</dt><dd><span className="muted">уточняется</span></dd>
            </dl>

            {site.stock.show && c.stock.length > 0 && (
              <>
                <h2 className="h-small">Таблица остатков (справочно)</h2>
                <ul className="stock-list">
                  {c.stock.map((s, i) => (
                    <li key={i}>{s.composition ?? 'Состав не указан'}{s.tex ? `, ${s.tex} текс` : ''} — {formatKg(s.kg)} <span className="muted">{s.date ? `на ${formatDate(s.date)}` : `таблица на ${formatDate(META.stockDate)}`}</span></li>
                  ))}
                </ul>
                <p className="hint">Это строки старой таблицы склада: общая масса цвета, а не вес бобины, и не подтверждение наличия выбранной скрутки и состава.</p>
              </>
            )}
            {c.assorti && (
              <div className="assorti">
                <h2 className="h-small">Из каких цветов состоит «Ассорти»</h2>
                <ul className="tag-list">{c.assorti.map((n) => <li key={n}>{n}</li>)}</ul>
              </div>
            )}
            {c.notes.length > 0 && <ul className="notes">{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            <Link className="btn btn-ghost" to={c.source === 'card' ? `/colors?pick=${c.id}` : '/colors'}><Palette aria-hidden="true" />Подобрать сочетания на палитре</Link>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section section-alt" aria-labelledby="sim-title">
          <div className="container">
            <div className="section-head"><h2 id="sim-title">Похожие цвета</h2></div>
            <div className="product-grid">{similar.map((x, i) => <ProductCard key={x.id} c={x} index={i} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
