import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHead } from './PageHead';
import { ProductCard } from '../components/ProductCard';
import { ColorChip } from '../components/ColorSwatch';
import { COLORS, META, PRODUCTS, colorById, formatDate, hueOf, labels, productTitle, searchText, type Product } from '../data/catalog';
import { COLOR_GROUPS, COMPOSITIONS, PURPOSES } from '../data/taxonomy';

const UNKNOWN = 'unknown';
const PAGE = 24;

/*
 * Фильтры строятся по данным: фильтр показывается, только если у товаров есть хотя бы два разных значения
 * (поэтому «Цена» появится сама, когда в данных будут цены). main — в основной строке, остальные — в «Ещё фильтры».
 */
type Def = { key: string; label: string; main?: boolean; values: (p: Product) => string[]; label4: (v: string) => string; order?: string[] };
const DEFS: Def[] = [
  { key: 'composition', label: 'Состав', main: true, values: (p) => (p.categories.length ? p.categories : [UNKNOWN]),
    label4: (v) => (v === UNKNOWN ? 'Состав уточняется' : labels.composition(v)), order: ['half-wool', ...COMPOSITIONS.map((c) => c.id).filter((id) => id !== 'half-wool'), UNKNOWN] },
  { key: 'price', label: 'Цена', main: true, values: (p) => [p.priceRub ? 'known' : UNKNOWN], label4: (v) => (v === UNKNOWN ? 'По запросу' : 'Указана') },
  { key: 'type', label: 'Тип пряжи', main: true, values: (p) => [p.yarnType ?? UNKNOWN],
    label4: (v) => ({ solid: 'Однотонная', melange: 'Меланжевая', mouline: 'Мулинированная', [UNKNOWN]: 'Не указан' } as Record<string, string>)[v] ?? v, order: ['solid', 'melange', 'mouline', UNKNOWN] },
  { key: 'tex', label: 'Толщина', values: (p) => [p.tex ? String(p.tex) : UNKNOWN],
    label4: (v) => (v === UNKNOWN ? 'Уточняется' : `${v} текс (Nm ≈ ${(1000 / Number(v)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })})`) },
  { key: 'ply', label: 'Сложения', values: (p) => [p.ply ? String(p.ply) : UNKNOWN], label4: (v) => (v === UNKNOWN ? 'Не указано' : `${v} сложения`) },
  { key: 'weight', label: 'Масса бобины', values: (p) => [p.bobbinWeightKg ? String(p.bobbinWeightKg) : UNKNOWN], label4: (v) => (v === UNKNOWN ? 'Не указана' : `${v} кг`) },
  { key: 'purpose', label: 'Назначение', values: (p) => (p.purpose.length ? p.purpose : [UNKNOWN]),
    label4: (v) => (v === UNKNOWN ? 'Не указано' : labels.purpose(v)), order: [...PURPOSES.map((c) => c.id), UNKNOWN] },
];
const STOCK = [{ v: '', l: 'Любое' }, { v: '10', l: 'от 10 кг' }, { v: '100', l: 'от 100 кг' }, { v: '500', l: 'от 500 кг' }, { v: '1000', l: 'от 1 т' }];
const SORTS = [{ v: 'color', l: 'По цвету' }, { v: 'name', l: 'По названию' }, { v: 'stock', l: 'По остатку' }, ...(PRODUCTS.some((p) => p.priceRub) ? [{ v: 'price', l: 'По цене' }] : [])];

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();
const groupsOf = (p: Product) => (p.groups.length ? p.groups : [UNKNOWN]);
const SHOWN = DEFS.filter((d) => new Set(PRODUCTS.flatMap(d.values)).size >= 2);
const MAIN = SHOWN.filter((d) => d.main), MORE = SHOWN.filter((d) => !d.main);
const GROUP_OPTS = [...COLOR_GROUPS.map((g) => g.id), UNKNOWN].filter((g) => PRODUCTS.some((p) => groupsOf(p).includes(g)));
const groupHex = (g: string) => COLORS.find((c) => c.group === g)?.hex ?? null;

/** Варианты фильтра: синонимы, выбирающие одни и те же товары (полушерсть = шерсть с акрилом), показываются один раз */
function optionsOf(d: Def) {
  const sorted = [...new Set(PRODUCTS.flatMap(d.values))].sort((a, b) => (d.order ? d.order.indexOf(a) - d.order.indexOf(b) : a === UNKNOWN ? 1 : b === UNKNOWN ? -1 : a.localeCompare(b, 'ru', { numeric: true })));
  const seen = new Set<string>();
  return sorted.filter((v) => { const k = PRODUCTS.filter((p) => d.values(p).includes(v)).map((p) => p.id).join(); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Компактная выпадающая кнопка фильтра (компьютер) */
function Popover({ label, count, id, open, setOpen, children, wide }: { label: string; count: number; id: string; open: string; setOpen: (v: string) => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = open === id;
  useEffect(() => {
    if (!isOpen) return;
    const out = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(''); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(''); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, [isOpen, setOpen]);
  return (
    <div className="fpop" ref={ref}>
      <button type="button" className={`fbtn${count ? ' has-value' : ''}`} aria-expanded={isOpen} aria-controls={`fp-${id}`} onClick={() => setOpen(isOpen ? '' : id)}>
        {label}{count > 0 && <span className="fbtn-n">{count}</span>}<ChevronDown aria-hidden="true" />
      </button>
      {isOpen && <div className={`fpanel${wide ? ' fpanel-wide' : ''}`} id={`fp-${id}`} role="group" aria-label={label}>{children}</div>}
    </div>
  );
}

export function CatalogPage() {
  const [sp, setSp] = useSearchParams();
  const get = (k: string) => (sp.get(k) ?? '').split(',').filter(Boolean);
  const q = sp.get('q') ?? '';
  const sort = sp.get('sort') ?? 'color';
  const minKg = Number(sp.get('stock') || 0);
  const [limit, setLimit] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);
  const [pop, setPop] = useState('');
  const [shadeQ, setShadeQ] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const setParam = (k: string, vals: string[] | string) => {
    const next = new URLSearchParams(sp);
    const v = Array.isArray(vals) ? vals.join(',') : vals;
    if (v) next.set(k, v); else next.delete(k);
    setSp(next, { replace: true });
    setLimit(PAGE);
  };
  const toggle = (k: string, v: string) => { const cur = get(k); setParam(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]); };

  /** Совпадение товара со всеми фильтрами; skip — какой фильтр не учитывать (для счётчиков вариантов) */
  const matches = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const groups = get('group'), colors = get('color');
    const sel = Object.fromEntries(SHOWN.map((d) => [d.key, get(d.key)]));
    return (p: Product, skip = '') => {
      if (words.length) { const t = searchText(p); if (!words.every((w) => t.includes(w))) return false; }
      // Цвет: выбранные группы и отдельные оттенки складываются («или»)
      if (skip !== 'color' && (groups.length || colors.length)) {
        const byGroup = groups.length && groupsOf(p).some((g) => groups.includes(g));
        const byShade = colors.length && p.colorId && colors.includes(p.colorId);
        if (!byGroup && !byShade) return false;
      }
      if (skip !== 'stock' && minKg && p.stock.kg < minKg) return false;
      return SHOWN.every((d) => d.key === skip || !sel[d.key].length || d.values(p).some((v) => sel[d.key].includes(v)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const filtered = useMemo(() => {
    const by: Record<string, (a: Product, b: Product) => number> = {
      color: (a, b) => hueOf(a.hex) - hueOf(b.hex) || a.colorName.localeCompare(b.colorName, 'ru'),
      name: (a, b) => productTitle(a).localeCompare(productTitle(b), 'ru'),
      stock: (a, b) => b.stock.kg - a.stock.kg,
      price: (a, b) => (a.priceRub ?? Infinity) - (b.priceRub ?? Infinity),
    };
    return PRODUCTS.filter((p) => matches(p)).sort(by[sort] ?? by.color);
  }, [matches, sort]);

  const countFor = (skip: string, test: (p: Product) => boolean) => PRODUCTS.filter((p) => matches(p, skip) && test(p)).length;

  const active = [
    ...get('group').map((v) => ({ k: 'group', v, l: v === UNKNOWN ? 'Без образца' : labels.group(v), hex: v === UNKNOWN ? null : groupHex(v) })),
    ...get('color').map((v) => ({ k: 'color', v, l: colorById.get(v)?.name ?? v, hex: colorById.get(v)?.hex ?? null })),
    ...SHOWN.flatMap((d) => get(d.key).map((v) => ({ k: d.key, v, l: d.label4(v), hex: undefined as string | null | undefined }))),
    ...(minKg ? [{ k: 'stock', v: '', l: `Наличие ${STOCK.find((s) => s.v === String(minKg))?.l ?? ''}`, hex: undefined }] : []),
    ...(q ? [{ k: 'q', v: '', l: `«${q}»`, hex: undefined }] : []),
  ];
  const reset = () => { setSp(new URLSearchParams(sort !== 'color' ? { sort } : {}), { replace: true }); setLimit(PAGE); };
  const colorCount = get('group').length + get('color').length;

  useEffect(() => { document.body.classList.toggle('scroll-lock', drawer); return () => document.body.classList.remove('scroll-lock'); }, [drawer]);
  useEffect(() => { if (!drawer) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [drawer]);

  /* ---------- Содержимое фильтров (общее для выпадашек и мобильной панели) ---------- */
  const shadeOptions = COLORS.filter((c) => PRODUCTS.some((p) => p.colorId === c.id)).filter((c) => !shadeQ || norm(c.name).includes(norm(shadeQ)) || c.code.includes(shadeQ)).sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
  const colorFilter = (
    <>
      <p className="fhint">Группа оттенков</p>
      <div className="dot-grid">
        {GROUP_OPTS.map((g) => {
          const sel = get('group').includes(g), n = countFor('color', (p) => groupsOf(p).includes(g));
          return (
            <button key={g} type="button" className="dot-opt" aria-pressed={sel} onClick={() => toggle('group', g)} title={g === UNKNOWN ? 'Без образца на карте' : labels.group(g)}>
              <ColorChip hex={g === UNKNOWN ? null : groupHex(g)} size="dot" />
              <span>{g === UNKNOWN ? 'Без образца' : labels.group(g)}</span><small>{n}</small>
            </button>
          );
        })}
      </div>
      <p className="fhint">Конкретный оттенок</p>
      <label className="sr-only" htmlFor="shade-q">Найти оттенок по названию или артикулу</label>
      <input id="shade-q" className="input input-sm" type="search" placeholder="Название или артикул" value={shadeQ} onChange={(e) => setShadeQ(e.target.value)} />
      <ul className="shade-list">
        {shadeOptions.map((c) => (
          <li key={c.id}>
            <label className="check check-sm" title={`${c.name}, ${c.code}`}>
              <input type="checkbox" checked={get('color').includes(c.id)} onChange={() => toggle('color', c.id)} />
              <ColorChip hex={c.hex} size="dot" />
              <span>{c.name} <span className="muted">{c.code}</span></span>
            </label>
          </li>
        ))}
        {!shadeOptions.length && <li className="muted small">Оттенок не найден</li>}
      </ul>
    </>
  );
  const defFilter = (d: Def) => (
    <div className="opt-list">
      {optionsOf(d).map((v) => (
        <label className="check check-sm" key={v}>
          <input type="checkbox" checked={get(d.key).includes(v)} onChange={() => toggle(d.key, v)} />
          <span>{d.label4(v)} <span className="muted">{countFor(d.key, (p) => d.values(p).includes(v))}</span></span>
        </label>
      ))}
    </div>
  );
  const stockFilter = (
    <div className="opt-list">
      <p className="fhint">Остаток по таблице склада на {formatDate(META.stockDate)}; перед заказом уточняйте</p>
      {STOCK.map((s) => (
        <label className="check check-sm" key={s.l}>
          <input type="radio" name={`stock-${drawer ? 'm' : 'd'}`} checked={String(minKg || '') === s.v} onChange={() => setParam('stock', s.v)} />
          <span>{s.l}{s.v && <> <span className="muted">{countFor('stock', (p) => p.stock.kg >= Number(s.v))}</span></>}</span>
        </label>
      ))}
    </div>
  );
  const moreFilter = MORE.map((d) => <fieldset className="fgroup" key={d.key}><legend>{d.label}</legend>{defFilter(d)}</fieldset>);
  const moreCount = MORE.reduce((n, d) => n + get(d.key).length, 0);

  return (
    <>
      <Seo title={get('group').length === 1 && get('group')[0] !== UNKNOWN ? `Пряжа на бобинах: ${labels.group(get('group')[0]).toLowerCase()}` : 'Каталог пряжи на бобинах'}
        description={`Каталог бобинной пряжи «Кавказская шерсть»: ${PRODUCTS.length} позиций — полушерсть и акрил, ${COLORS.length} оттенков по карте расцветок. Фильтры по цвету и составу, заявка на опт.`} />
      <PageHead title="Каталог пряжи" crumb="Каталог" compact lead="Полушерсть и акрил на бобинах для машинного вязания. Выберите цвет — и добавьте пряжу в заявку." />

      <div className="container catalog">
        <div className="cat-top">
          <form className="toolbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="cat-q">Поиск по названию, цвету, составу, артикулу</label>
            <Search aria-hidden="true" />
            <input id="cat-q" className="input" type="search" placeholder="Поиск: цвет, состав, артикул" value={q} onChange={(e) => setParam('q', e.target.value)} />
          </form>
          <label className="sort">
            <span className="sr-only">Сортировка</span>
            <select className="select select-sm" value={sort} onChange={(e) => setParam('sort', e.target.value === 'color' ? '' : e.target.value)}>
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
        </div>

        <div className="fbar">
          <button className="fbtn filters-btn" type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            <SlidersHorizontal aria-hidden="true" />Фильтры{active.length > 0 && <span className="fbtn-n">{active.length}</span>}
          </button>
          <div className="fbar-desk">
            <Popover id="color" label="Цвет" count={colorCount} open={pop} setOpen={setPop} wide>{colorFilter}</Popover>
            {MAIN.map((d) => <Popover key={d.key} id={d.key} label={d.label} count={get(d.key).length} open={pop} setOpen={setPop}>{defFilter(d)}</Popover>)}
            <Popover id="stock" label="Наличие" count={minKg ? 1 : 0} open={pop} setOpen={setPop}>{stockFilter}</Popover>
            {MORE.length > 0 && <Popover id="more" label="Ещё фильтры" count={moreCount} open={pop} setOpen={setPop}>{moreFilter}</Popover>}
          </div>
          <p className="results-count" aria-live="polite">Найдено: <b>{filtered.length}</b></p>
        </div>

        {active.length > 0 && (
          <ul className="active-chips" aria-label="Выбранные фильтры">
            {active.map((a) => (
              <li key={a.k + a.v}>
                <button type="button" className="achip" onClick={() => (a.k === 'q' || a.k === 'stock' ? setParam(a.k, '') : toggle(a.k, a.v))} aria-label={`Убрать фильтр: ${a.l}`}>
                  {a.hex !== undefined && <ColorChip hex={a.hex} size="dot" />}{a.l}<X aria-hidden="true" />
                </button>
              </li>
            ))}
            <li><button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Сбросить</button></li>
          </ul>
        )}

        <div ref={resultsRef} className="catalog-results">
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
              <p>Под выбранные условия нет пряжи. Уберите часть фильтров или поищите оттенок на палитре.</p>
              <div className="actions"><button className="btn btn-primary" type="button" onClick={reset}>Сбросить</button><Link className="btn btn-outline" to="/colors">Подбор по цвету</Link></div>
            </div>
          )}
        </div>
      </div>

      <div className={`drawer${drawer ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Фильтры" hidden={!drawer}>
        <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
        <div className="drawer-panel">
          <div className="drawer-head"><h2>Фильтры</h2><button className="icon-btn" type="button" onClick={() => setDrawer(false)} aria-label="Закрыть фильтры"><X aria-hidden="true" /></button></div>
          {drawer && <div className="drawer-body">
            <fieldset className="fgroup"><legend>Цвет</legend>{colorFilter}</fieldset>
            {MAIN.map((d) => <fieldset className="fgroup" key={d.key}><legend>{d.label}</legend>{defFilter(d)}</fieldset>)}
            <fieldset className="fgroup"><legend>Наличие</legend>{stockFilter}</fieldset>
            {MORE.length > 0 && (
              <details className="fmore" open={moreCount > 0}>
                <summary>Ещё фильтры{moreCount > 0 && <span className="fbtn-n">{moreCount}</span>}</summary>
                {moreFilter}
              </details>
            )}
          </div>}
          <div className="drawer-foot">
            <button className="btn btn-outline" type="button" onClick={reset}>Сбросить</button>
            <button className="btn btn-primary" type="button" onClick={() => { setDrawer(false); resultsRef.current?.scrollIntoView({ block: 'start' }); }}>Показать товары ({filtered.length})</button>
          </div>
        </div>
      </div>
    </>
  );
}
