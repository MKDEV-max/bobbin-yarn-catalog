import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { COLORS, META, PRODUCTS, colorById, formatDate, hueOf, labels, productTitle, searchText, type Product } from '../data/catalog';
import { COLOR_GROUPS, COMPOSITIONS, PURPOSES } from '../data/taxonomy';

const UNKNOWN = 'unknown';
const PAGE = 24;

/*
 * Фильтры строятся по данным: группа показывается, если у товаров есть хотя бы два разных значения.
 * Появятся в данных цены, вес бобины или номер Nm — добавьте фильтр сюда по тому же образцу.
 */
type Def = { key: string; label: string; values: (p: Product) => string[]; label4: (v: string) => string; order?: string[] };
const DEFS: Def[] = [
  { key: 'composition', label: 'Состав', values: (p) => (p.categories.length ? p.categories : [UNKNOWN]),
    label4: (v) => (v === UNKNOWN ? 'Состав уточняется' : labels.composition(v)), order: ['half-wool', ...COMPOSITIONS.map((c) => c.id).filter((id) => id !== 'half-wool'), UNKNOWN] },
  { key: 'type', label: 'Тип нити', values: (p) => [p.yarnType ?? UNKNOWN],
    label4: (v) => ({ solid: 'Однотонная', melange: 'Меланжевая', mouline: 'Мулинированная', [UNKNOWN]: 'Не указан' } as Record<string, string>)[v] ?? v, order: ['solid', 'melange', 'mouline', UNKNOWN] },
  { key: 'tex', label: 'Толщина', values: (p) => [p.tex ? String(p.tex) : UNKNOWN],
    label4: (v) => (v === UNKNOWN ? 'Уточняется' : `${v} текс (Nm ≈ ${(1000 / Number(v)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })})`) },
  { key: 'ply', label: 'Сложения', values: (p) => [p.ply ? String(p.ply) : UNKNOWN], label4: (v) => (v === UNKNOWN ? 'Не указано' : `${v} сложения`) },
  { key: 'weight', label: 'Масса бобины', values: (p) => [p.bobbinWeightKg ? String(p.bobbinWeightKg) : UNKNOWN], label4: (v) => (v === UNKNOWN ? 'Не указана' : `${v} кг`) },
  { key: 'purpose', label: 'Назначение', values: (p) => (p.purpose.length ? p.purpose : [UNKNOWN]),
    label4: (v) => (v === UNKNOWN ? 'Не указано' : labels.purpose(v)), order: [...PURPOSES.map((c) => c.id), UNKNOWN] },
  { key: 'price', label: 'Цена', values: (p) => [p.priceRub ? 'known' : UNKNOWN], label4: (v) => (v === UNKNOWN ? 'По запросу' : 'Указана') },
];
const STOCK = [{ v: '', l: 'Любой' }, { v: '10', l: 'от 10 кг' }, { v: '100', l: 'от 100 кг' }, { v: '500', l: 'от 500 кг' }, { v: '1000', l: 'от 1 т' }];
const SORTS = [{ v: 'color', l: 'По цвету' }, { v: 'name', l: 'По названию' }, { v: 'stock', l: 'По остатку' }, ...(PRODUCTS.some((p) => p.priceRub) ? [{ v: 'price', l: 'По цене' }] : [])];

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();
const groupsOf = (p: Product) => (p.groups.length ? p.groups : [UNKNOWN]);

export function CatalogPage() {
  const [sp, setSp] = useSearchParams();
  const get = (k: string) => (sp.get(k) ?? '').split(',').filter(Boolean);
  const q = sp.get('q') ?? '';
  const sort = sp.get('sort') ?? 'color';
  const minKg = Number(sp.get('stock') || 0);
  const [limit, setLimit] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);
  const [shadeQ, setShadeQ] = useState('');
  const resultsRef = useRef<HTMLParagraphElement>(null);

  const setParam = (k: string, vals: string[] | string) => {
    const next = new URLSearchParams(sp);
    const v = Array.isArray(vals) ? vals.join(',') : vals;
    if (v) next.set(k, v); else next.delete(k);
    setSp(next, { replace: true });
    setLimit(PAGE);
  };
  const toggle = (k: string, v: string) => { const cur = get(k); setParam(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]); };

  const shown = DEFS.filter((d) => new Set(PRODUCTS.flatMap(d.values)).size >= 2);

  const filtered = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const groups = get('group'), colors = get('color');
    let list = PRODUCTS.filter((p) => {
      if (words.length) { const t = searchText(p); if (!words.every((w) => t.includes(w))) return false; }
      if (groups.length && !groupsOf(p).some((g) => groups.includes(g))) return false;
      if (colors.length && !(p.colorId && colors.includes(p.colorId))) return false;
      if (minKg && p.stock.kg < minKg) return false;
      return shown.every((d) => { const sel = get(d.key); return !sel.length || d.values(p).some((v) => sel.includes(v)); });
    });
    const by: Record<string, (a: Product, b: Product) => number> = {
      color: (a, b) => hueOf(a.hex) - hueOf(b.hex) || a.colorName.localeCompare(b.colorName, 'ru'),
      name: (a, b) => productTitle(a).localeCompare(productTitle(b), 'ru'),
      stock: (a, b) => b.stock.kg - a.stock.kg,
      price: (a, b) => (a.priceRub ?? Infinity) - (b.priceRub ?? Infinity),
    };
    list = [...list].sort(by[sort] ?? by.color);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const active = [
    ...get('group').map((v) => ({ k: 'group', v, l: v === UNKNOWN ? 'Без группы' : labels.group(v) })),
    ...get('color').map((v) => ({ k: 'color', v, l: colorById.get(v)?.name ?? v })),
    ...shown.flatMap((d) => get(d.key).map((v) => ({ k: d.key, v, l: d.label4(v) }))),
    ...(minKg ? [{ k: 'stock', v: '', l: STOCK.find((s) => s.v === String(minKg))?.l ?? '' }] : []),
    ...(q ? [{ k: 'q', v: '', l: `«${q}»` }] : []),
  ];
  const reset = () => { setSp(new URLSearchParams(sort !== 'color' ? { sort } : {}), { replace: true }); setLimit(PAGE); };

  useEffect(() => { document.body.classList.toggle('scroll-lock', drawer); return () => document.body.classList.remove('scroll-lock'); }, [drawer]);
  useEffect(() => { if (!drawer) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [drawer]);

  // Счётчик значения фильтра — сколько товаров останется, если выбрать его (при прочих фильтрах)
  const countFor = (match: (p: Product) => boolean) => filtered.filter(match).length;
  const shadeOptions = COLORS.filter((c) => PRODUCTS.some((p) => p.colorId === c.id)).filter((c) => !shadeQ || norm(c.name).includes(norm(shadeQ)) || c.code.includes(shadeQ)).sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
  const groupOpts = [...COLOR_GROUPS.map((g) => g.id), UNKNOWN].filter((g) => PRODUCTS.some((p) => groupsOf(p).includes(g)));

  const filters = (
    <div className="filters">
      <fieldset className="filter-group">
        <legend>Группа оттенков</legend>
        <div className="chip-wrap">
          {groupOpts.map((g) => {
            const sel = get('group').includes(g);
            return (
              <button key={g} type="button" className="chip" aria-pressed={sel} onClick={() => toggle('group', g)}>
                {g !== UNKNOWN && <span className="chip-dot" style={{ background: COLORS.find((c) => c.group === g)?.hex }} aria-hidden="true" />}
                {g === UNKNOWN ? 'Без образца' : labels.group(g)}
                <span className="chip-n">{sel ? '✓' : PRODUCTS.filter((p) => groupsOf(p).includes(g)).length}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="filter-group">
        <legend>Оттенок <span className="muted">(можно несколько)</span></legend>
        <label className="sr-only" htmlFor="shade-q">Найти оттенок</label>
        <input id="shade-q" className="input input-sm" type="search" placeholder="Название или артикул оттенка" value={shadeQ} onChange={(e) => setShadeQ(e.target.value)} />
        <ul className="shade-list">
          {shadeOptions.map((c) => (
            <li key={c.id}>
              <label className="check">
                <input type="checkbox" checked={get('color').includes(c.id)} onChange={() => toggle('color', c.id)} />
                <span className="shade-dot" style={{ background: c.hex }} aria-hidden="true" />
                <span>{c.name} <span className="muted">{c.code}</span></span>
              </label>
            </li>
          ))}
          {!shadeOptions.length && <li className="muted small">Оттенок не найден</li>}
        </ul>
      </fieldset>

      {shown.map((d) => {
        const sorted = [...new Set(PRODUCTS.flatMap(d.values))].sort((a, b) => (d.order ? d.order.indexOf(a) - d.order.indexOf(b) : a === UNKNOWN ? 1 : b === UNKNOWN ? -1 : a.localeCompare(b, 'ru', { numeric: true })));
        // Синонимы (например, «полушерсть» и «шерсть с акрилом») выбирают одни и те же товары — показываем один вариант
        const seen = new Set<string>();
        const vals = sorted.filter((v) => { const k = PRODUCTS.filter((p) => d.values(p).includes(v)).map((p) => p.id).join(); if (seen.has(k)) return false; seen.add(k); return true; });
        return (
          <fieldset className="filter-group" key={d.key}>
            <legend>{d.label}</legend>
            {vals.map((v) => (
              <label className="check" key={v}>
                <input type="checkbox" checked={get(d.key).includes(v)} onChange={() => toggle(d.key, v)} />
                <span>{d.label4(v)} <span className="muted">({countFor((p) => d.values(p).includes(v))})</span></span>
              </label>
            ))}
          </fieldset>
        );
      })}

      <fieldset className="filter-group">
        <legend>Остаток на складе</legend>
        <p className="hint">По таблице на {formatDate(META.stockDate)} — справочно</p>
        {STOCK.map((s) => (
          <label className="check" key={s.l}>
            <input type="radio" name="stock" checked={String(minKg || '') === s.v} onChange={() => setParam('stock', s.v)} />
            <span>{s.l}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );

  const groupTitle = get('group').length === 1 && get('group')[0] !== UNKNOWN ? labels.group(get('group')[0]) : '';
  const compTitle = get('composition').length === 1 && get('composition')[0] !== UNKNOWN ? labels.composition(get('composition')[0]) : '';
  const h1 = groupTitle ? `Пряжа на бобинах: ${groupTitle.toLowerCase()}` : compTitle ? `${compTitle} на бобинах` : 'Каталог бобинной пряжи';

  return (
    <>
      <Seo title={h1} description={`${h1}: ${filtered.length} позиций с образцами цвета, составом и остатками. Фильтры по оттенку, составу и толщине, заявка на опт.`} />
      <div className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/">Главная</Link></li><li aria-current="page">Каталог</li></ol></nav>
          <h1>{h1}</h1>
          <p className="lead">Пряжа для машинного вязания: полушерсть и акрил. Цвета — по карте расцветок, остатки — по данным склада на {formatDate(META.stockDate)}.</p>
        </div>
      </div>

      <div className="container catalog">
        <aside className="catalog-side" aria-label="Фильтры каталога">{filters}</aside>

        <div className="catalog-main">
          <div className="toolbar">
            <form className="toolbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
              <label className="sr-only" htmlFor="cat-q">Поиск по названию, цвету, составу</label>
              <Search aria-hidden="true" />
              <input id="cat-q" className="input" type="search" placeholder="Поиск: цвет, состав, артикул" value={q} onChange={(e) => setParam('q', e.target.value)} />
            </form>
            <button className="btn btn-outline filters-btn" type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog">
              <SlidersHorizontal aria-hidden="true" />Фильтры{active.length > 0 && <span className="chip-n">{active.length}</span>}
            </button>
            <label className="sort">
              <span className="sr-only">Сортировка</span>
              <select className="select" value={sort} onChange={(e) => setParam('sort', e.target.value === 'color' ? '' : e.target.value)}>
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </label>
          </div>

          <div className="results-bar">
            <p ref={resultsRef} className="results-count" aria-live="polite">Найдено: <b>{filtered.length}</b> из {PRODUCTS.length}</p>
            {active.length > 0 && (
              <ul className="active-chips">
                {active.map((a) => (
                  <li key={a.k + a.v}><button type="button" className="chip chip-active" onClick={() => (a.k === 'q' || a.k === 'stock' ? setParam(a.k, '') : toggle(a.k, a.v))} aria-label={`Убрать фильтр: ${a.l}`}>{a.l}<X aria-hidden="true" /></button></li>
                ))}
                <li><button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Сбросить все</button></li>
              </ul>
            )}
          </div>

          {filtered.length ? (
            <>
              <div className="product-grid">{filtered.slice(0, limit).map((p, i) => <ProductCard key={p.id} p={p} index={i % PAGE} />)}</div>
              {limit < filtered.length && (
                <div className="more-row">
                  <button className="btn btn-outline" type="button" onClick={() => setLimit((l) => l + PAGE)}>Показать ещё {Math.min(PAGE, filtered.length - limit)}</button>
                  <span className="muted small">Показано {Math.min(limit, filtered.length)} из {filtered.length}</span>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2>Ничего не найдено</h2>
              <p>Попробуйте убрать часть фильтров или поискать по другому названию. Нужный оттенок можно найти на карте расцветок.</p>
              <div className="actions"><button className="btn btn-primary" type="button" onClick={reset}>Сбросить фильтры</button><Link className="btn btn-outline" to="/colors">Подбор по цвету</Link></div>
            </div>
          )}
        </div>
      </div>

      <div className={`drawer${drawer ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Фильтры" hidden={!drawer}>
        <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
        <div className="drawer-panel">
          <div className="drawer-head"><h2>Фильтры</h2><button className="icon-btn" type="button" onClick={() => setDrawer(false)} aria-label="Закрыть фильтры"><X aria-hidden="true" /></button></div>
          <div className="drawer-body">{filters}</div>
          <div className="drawer-foot">
            <button className="btn btn-outline" type="button" onClick={reset}>Сбросить</button>
            <button className="btn btn-primary" type="button" onClick={() => { setDrawer(false); resultsRef.current?.scrollIntoView(); }}>Показать {filtered.length}</button>
          </div>
        </div>
      </div>
    </>
  );
}
