import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHead } from './PageHead';
import { ProductCard } from '../components/ProductCard';
import { ColorChip, ColorMark } from '../components/ColorSwatch';
import { CATALOG, META, colorConfigs, colorSearchText, formatDate, hueOf, labels, type CatalogColor } from '../data/catalog';
import { COLOR_GROUPS } from '../data/taxonomy';
import { COMPOSITION_OPTIONS, TWISTS, type CompId, type Twist } from '../data/variants';

const UNKNOWN = 'unknown';
const PAGE = 24;
const TYPE_LABEL: Record<string, string> = { solid: 'Однотонная', melange: 'Меланжевая', mouline: 'Мулинированная', [UNKNOWN]: 'Не указан' };
const SORTS = [{ v: 'color', l: 'По цвету' }, { v: 'name', l: 'По названию' }, { v: 'code', l: 'По артикулу' }];

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();
const groupsOf = (c: CatalogColor) => (c.groups.length ? c.groups : [UNKNOWN]);
const typeOf = (c: CatalogColor) => c.type ?? UNKNOWN;
const GROUP_OPTS = [...COLOR_GROUPS.map((g) => g.id), UNKNOWN].filter((g) => CATALOG.some((c) => groupsOf(c).includes(g)));
const TYPE_OPTS = ['solid', 'melange', 'mouline', UNKNOWN].filter((t) => CATALOG.some((c) => typeOf(c) === t));
const groupHex = (g: string) => CATALOG.find((c) => c.group === g && c.hex)?.hex ?? null;
const STOCK_OPTS = [{ v: 'yes', l: 'Есть в таблице остатков' }, { v: 'no', l: 'Нет в таблице остатков' }];

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
  const twists = get('twist').filter((t): t is Twist => (TWISTS as readonly string[]).includes(t));
  const comps = get('comp').filter((c): c is CompId => COMPOSITION_OPTIONS.some((o) => o.id === c));

  /** Совпадение цвета со всеми фильтрами; skip — какой фильтр не учитывать (для счётчиков вариантов) */
  const matches = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const groups = get('group'), shades = get('color'), types = get('type'), stock = get('stock');
    return (c: CatalogColor, skip = '') => {
      if (words.length) { const t = colorSearchText(c); if (!words.every((w) => t.includes(w))) return false; }
      // Цвет: выбранные группы и отдельные оттенки складываются («или»)
      if (skip !== 'color' && (groups.length || shades.length)) {
        if (!(groups.length && groupsOf(c).some((g) => groups.includes(g))) && !shades.includes(c.id)) return false;
      }
      // Скрутка и состав: у цвета должна быть конфигурация, подходящая под оба условия сразу
      if ((twists.length || comps.length) && skip !== 'twist' && skip !== 'comp') {
        if (!colorConfigs(c).some((k) => (!twists.length || twists.includes(k.twist)) && (!comps.length || comps.includes(k.comp)))) return false;
      }
      if (skip !== 'type' && types.length && !types.includes(typeOf(c))) return false;
      if (skip !== 'stock' && stock.length && !stock.includes(c.stock.length ? 'yes' : 'no')) return false;
      return true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const filtered = useMemo(() => {
    const by: Record<string, (a: CatalogColor, b: CatalogColor) => number> = {
      color: (a, b) => hueOf(a.hex) - hueOf(b.hex) || a.name.localeCompare(b.name, 'ru'),
      name: (a, b) => a.name.localeCompare(b.name, 'ru'),
      code: (a, b) => (a.code ?? '~').localeCompare(b.code ?? '~', 'ru', { numeric: true }),
    };
    return CATALOG.filter((c) => matches(c)).sort(by[sort] ?? by.color);
  }, [matches, sort]);

  const countFor = (skip: string, test: (c: CatalogColor) => boolean) => CATALOG.filter((c) => matches(c, skip) && test(c)).length;
  const configCount = (skip: string, test: (k: ReturnType<typeof colorConfigs>[number]) => boolean) =>
    CATALOG.filter((c) => matches(c, skip)).reduce((n, c) => n + colorConfigs(c).filter(test).length, 0);

  const active = [
    ...get('group').map((v) => ({ k: 'group', v, l: v === UNKNOWN ? 'Цвет уточняется' : labels.group(v), hex: v === UNKNOWN ? null : groupHex(v) as string | null | undefined })),
    ...get('color').map((v) => { const c = CATALOG.find((x) => x.id === v); return { k: 'color', v, l: c?.name ?? v, hex: c?.hex ?? null as string | null | undefined, tones: c?.tones }; }),
    ...twists.map((v) => ({ k: 'twist', v, l: `Скрутка ${v}`, hex: undefined })),
    ...comps.map((v) => ({ k: 'comp', v, l: COMPOSITION_OPTIONS.find((o) => o.id === v)!.label, hex: undefined })),
    ...get('type').map((v) => ({ k: 'type', v, l: TYPE_LABEL[v] ?? v, hex: undefined })),
    ...get('stock').map((v) => ({ k: 'stock', v, l: STOCK_OPTS.find((o) => o.v === v)?.l ?? v, hex: undefined })),
    ...(q ? [{ k: 'q', v: '', l: `«${q}»`, hex: undefined }] : []),
  ];
  const reset = () => { setSp(new URLSearchParams(sort !== 'color' ? { sort } : {}), { replace: true }); setLimit(PAGE); };
  const colorCount = get('group').length + get('color').length;
  // Одна скрутка и один состав в фильтре — подставляем их в карточки
  const preTwist = twists.length === 1 ? twists[0] : null, preComp = comps.length === 1 ? comps[0] : null;

  useEffect(() => { document.body.classList.toggle('scroll-lock', drawer); return () => document.body.classList.remove('scroll-lock'); }, [drawer]);
  useEffect(() => { if (!drawer) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [drawer]);

  /* ---------- Содержимое фильтров (общее для выпадашек и мобильной панели) ---------- */
  const shadeOptions = CATALOG.filter((c) => !shadeQ || norm(c.name).includes(norm(shadeQ)) || (c.code ?? '').includes(shadeQ)).sort((a, b) => hueOf(a.hex) - hueOf(b.hex) || a.name.localeCompare(b.name, 'ru'));
  const colorFilter = (
    <>
      <p className="fhint">Группа оттенков</p>
      <div className="dot-grid">
        {GROUP_OPTS.map((g) => (
          <button key={g} type="button" className="dot-opt" aria-pressed={get('group').includes(g)} onClick={() => toggle('group', g)} title={g === UNKNOWN ? 'Цвет уточняется' : labels.group(g)}>
            <ColorChip hex={g === UNKNOWN ? null : groupHex(g)} size="dot" />
            <span>{g === UNKNOWN ? 'Цвет уточняется' : labels.group(g)}</span><small>{countFor('color', (c) => groupsOf(c).includes(g))}</small>
          </button>
        ))}
      </div>
      <p className="fhint">Конкретный цвет</p>
      <label className="sr-only" htmlFor="shade-q">Найти цвет по названию или артикулу</label>
      <input id="shade-q" className="input input-sm" type="search" placeholder="Название или артикул" value={shadeQ} onChange={(e) => setShadeQ(e.target.value)} />
      <ul className="shade-list">
        {shadeOptions.map((c) => (
          <li key={c.id}>
            <label className="check check-sm" title={`${c.name}${c.code ? `, ${c.code}` : ''}`}>
              <input type="checkbox" checked={get('color').includes(c.id)} onChange={() => toggle('color', c.id)} />
              <ColorMark c={c} size="dot" />
              <span>{c.name} {c.code ? <span className="muted">{c.code}</span> : c.status === 'unverified' && <span className="muted">· уточняется</span>}</span>
            </label>
          </li>
        ))}
        {!shadeOptions.length && <li className="muted small">Цвет не найден</li>}
      </ul>
    </>
  );
  const twistFilter = (
    <div className="opt-list">
      {TWISTS.map((t) => (
        <label className="check check-sm" key={t}>
          <input type="checkbox" checked={twists.includes(t)} onChange={() => toggle('twist', t)} />
          <span>Скрутка {t} <span className="muted">{configCount('twist', (k) => k.twist === t && (!comps.length || comps.includes(k.comp)))} конф.</span></span>
        </label>
      ))}
    </div>
  );
  const compFilter = (
    <div className="opt-list">
      {COMPOSITION_OPTIONS.map((o) => (
        <label className="check check-sm" key={o.id}>
          <input type="checkbox" checked={comps.includes(o.id)} onChange={() => toggle('comp', o.id)} />
          <span>{o.label}{o.note && <span className="muted"> — {o.note}</span>} <span className="muted">{configCount('comp', (k) => k.comp === o.id && (!twists.length || twists.includes(k.twist)))} конф.</span></span>
        </label>
      ))}
    </div>
  );
  const typeFilter = (
    <div className="opt-list">
      {TYPE_OPTS.map((t) => (
        <label className="check check-sm" key={t}>
          <input type="checkbox" checked={get('type').includes(t)} onChange={() => toggle('type', t)} />
          <span>{TYPE_LABEL[t]} <span className="muted">{countFor('type', (c) => typeOf(c) === t)}</span></span>
        </label>
      ))}
    </div>
  );
  const stockFilter = (
    <div className="opt-list">
      <p className="fhint">Справочно: таблица склада на {formatDate(META.stockDate)}. Не подтверждает наличие конкретной скрутки и состава.</p>
      {STOCK_OPTS.map((o) => (
        <label className="check check-sm" key={o.v}>
          <input type="checkbox" checked={get('stock').includes(o.v)} onChange={() => toggle('stock', o.v)} />
          <span>{o.l} <span className="muted">{countFor('stock', (c) => (c.stock.length ? 'yes' : 'no') === o.v)}</span></span>
        </label>
      ))}
    </div>
  );
  const moreFilter = (
    <>
      {TYPE_OPTS.length > 1 && <fieldset className="fgroup"><legend>Тип пряжи</legend>{typeFilter}</fieldset>}
      <fieldset className="fgroup"><legend>Таблица остатков</legend>{stockFilter}</fieldset>
    </>
  );
  const moreCount = get('type').length + get('stock').length;

  return (
    <>
      <Seo title={get('group').length === 1 && get('group')[0] !== UNKNOWN ? `Пряжа на бобинах: ${labels.group(get('group')[0]).toLowerCase()}` : 'Каталог пряжи на бобинах'}
        description={`Каталог бобинной пряжи «Кавказская шерсть»: ${CATALOG.length} цветов, скрутка 16/2 и 32/2, составы 30/70, 50/50, 100% ПАН и индивидуальный. Фильтры по цвету, скрутке и составу, заявка на опт.`} />
      <PageHead title="Каталог пряжи" crumb="Каталог" compact
        lead={`${CATALOG.length} цветов. Для каждого — скрутка 16/2 или 32/2 и состав: 30/70, 50/50, 100% ПАН или индивидуальный.`} />

      <div className="container catalog">
        <div className="cat-top">
          <form className="toolbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="cat-q">Поиск по названию цвета и артикулу</label>
            <Search aria-hidden="true" />
            <input id="cat-q" className="input" type="search" placeholder="Поиск: название цвета или артикул" value={q} onChange={(e) => setParam('q', e.target.value)} />
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
            <Popover id="twist" label="Скрутка" count={twists.length} open={pop} setOpen={setPop}>{twistFilter}</Popover>
            <Popover id="comp" label="Состав" count={comps.length} open={pop} setOpen={setPop} wide>{compFilter}</Popover>
            <Popover id="more" label="Ещё фильтры" count={moreCount} open={pop} setOpen={setPop}>{moreFilter}</Popover>
          </div>
          <p className="results-count" aria-live="polite">Цветов: <b>{filtered.length}</b></p>
        </div>

        {active.length > 0 && (
          <ul className="active-chips" aria-label="Выбранные фильтры">
            {active.map((a) => (
              <li key={a.k + a.v}>
                <button type="button" className="achip" onClick={() => (a.k === 'q' ? setParam('q', '') : toggle(a.k, a.v))} aria-label={`Убрать фильтр: ${a.l}`}>
                  {a.hex !== undefined && <ColorChip hex={a.hex} tones={(a as { tones?: string[] }).tones} size="dot" />}{a.l}<X aria-hidden="true" />
                </button>
              </li>
            ))}
            <li><button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Сбросить</button></li>
          </ul>
        )}

        <div ref={resultsRef} className="catalog-results">
          {filtered.length ? (
            <>
              <div className="product-grid">
                {filtered.slice(0, limit).map((c, i) => <ProductCard key={`${c.id}|${preTwist}|${preComp}`} c={c} index={i % PAGE} twist={preTwist} comp={preComp} />)}
              </div>
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
              <p>Под выбранные условия нет цветов. Уберите часть фильтров или поищите цвет на палитре.</p>
              <div className="actions"><button className="btn btn-primary" type="button" onClick={reset}>Сбросить фильтры</button><Link className="btn btn-outline" to="/colors">Подбор по цвету</Link></div>
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
            <fieldset className="fgroup"><legend>Скрутка</legend>{twistFilter}</fieldset>
            <fieldset className="fgroup"><legend>Состав</legend>{compFilter}</fieldset>
            <details className="fmore" open={moreCount > 0}>
              <summary>Ещё фильтры{moreCount > 0 && <span className="fbtn-n">{moreCount}</span>}</summary>
              {moreFilter}
            </details>
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
