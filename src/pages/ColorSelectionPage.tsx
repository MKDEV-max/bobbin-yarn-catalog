import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardPlus, Columns3, Search, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ColorSwatch } from '../components/ColorSwatch';
import { ProductCard, asset } from '../components/ProductCard';
import { COLORS, META, PRODUCTS, colorById, hueOf, labels } from '../data/catalog';
import { COLOR_GROUPS } from '../data/taxonomy';
import { useStore, useToast } from '../state/store';

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();

export function ColorSelectionPage() {
  const [sp, setSp] = useSearchParams();
  const picked = (sp.get('pick') ?? '').split(',').filter((id) => colorById.has(id));
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [compare, setCompare] = useState(false);
  const { addToRequest } = useStore();
  const toast = useToast();

  const setPicked = (ids: string[]) => { const n = new URLSearchParams(sp); if (ids.length) n.set('pick', ids.join(',')); else n.delete('pick'); setSp(n, { replace: true }); };
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const counts = useMemo(() => { const m = new Map<string, number>(); for (const p of PRODUCTS) if (p.colorId) m.set(p.colorId, (m.get(p.colorId) ?? 0) + 1); return m; }, []);
  const list = COLORS.filter((c) => (!group || c.groups.includes(group)) && (!q || norm(c.name).includes(norm(q)) || c.code.toLowerCase().includes(norm(q))))
    .sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
  const groups = COLOR_GROUPS.filter((g) => COLORS.some((c) => c.groups.includes(g.id)));
  const pickedColors = picked.map((id) => colorById.get(id)!);
  const matches = PRODUCTS.filter((p) => p.colorId && picked.includes(p.colorId));

  return (
    <>
      <Seo title="Подбор пряжи по цвету — палитра оттенков с образцами" description={`Палитра из ${COLORS.length} оттенков бобинной пряжи с фото образцов и артикулами. Выберите несколько цветов, сравните и добавьте подходящие позиции в заявку.`} />
      <div className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/">Главная</Link></li><li aria-current="page">Подбор по цвету</li></ol></nav>
          <h1>Подбор пряжи по цвету</h1>
          <p className="lead">{COLORS.length} оттенков с карты расцветок{META.cardTitle ? '' : ''}: фото мотка, название и артикул. Выберите один или несколько цветов — ниже появятся подходящие позиции.</p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          <p className="alert alert-info" style={{ marginBottom: 'var(--space-5)' }}>Полоса под фото — приблизительный цвет, снятый с фото карты. Экран и освещение искажают оттенок: ориентируйтесь на фото мотка, а для точного подбора запросите образец.</p>
          <div className="palette-tools">
            <div className="toolbar-search">
              <label className="sr-only" htmlFor="pal-q">Найти оттенок по названию или артикулу</label>
              <Search aria-hidden="true" />
              <input id="pal-q" className="input" type="search" placeholder="Название или артикул, например «бирюза» или 409/2" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="chip-wrap" role="group" aria-label="Группа оттенков">
              <button type="button" className="chip" aria-pressed={!group} onClick={() => setGroup('')}>Все <span className="chip-n">{COLORS.length}</span></button>
              {groups.map((g) => (
                <button key={g.id} type="button" className="chip" aria-pressed={group === g.id} onClick={() => setGroup(group === g.id ? '' : g.id)}>
                  <span className="chip-dot" style={{ background: COLORS.find((c) => c.group === g.id)?.hex }} aria-hidden="true" />{g.label}
                </button>
              ))}
            </div>
          </div>

          <p className="results-count" aria-live="polite">Оттенков: <b>{list.length}</b>{picked.length > 0 && <> · выбрано: <b>{picked.length}</b></>}</p>
          {list.length ? (
            <div className="palette">
              {list.map((c) => <ColorSwatch key={c.id} c={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} count={counts.get(c.id) ?? 0} />)}
            </div>
          ) : (
            <div className="empty-state"><h2>Оттенок не найден</h2><p>Проверьте написание или выберите другую группу.</p><button className="btn btn-outline" type="button" onClick={() => { setQ(''); setGroup(''); }}>Показать все оттенки</button></div>
          )}
        </div>
      </section>

      {picked.length > 0 && (
        <section className="section section-alt" aria-labelledby="picked-title" id="picked">
          <div className="container">
            <div className="head-row">
              <div className="section-head"><p className="eyebrow">Выбранные оттенки</p><h2 id="picked-title">Ваша подборка: {picked.length}</h2>
                <p>{matches.length ? `Подходящих позиций в каталоге: ${matches.length}.` : 'Этих оттенков нет в таблице остатков — уточните возможность заказа в заявке.'}</p></div>
              <div className="actions">
                <button className="btn btn-outline" type="button" aria-pressed={compare} onClick={() => setCompare((v) => !v)}><Columns3 aria-hidden="true" />{compare ? 'Скрыть сравнение' : 'Сравнить'}</button>
                {matches.length > 0 && <button className="btn btn-primary" type="button" onClick={() => { addToRequest(matches.map((m) => m.id)); toast.show(`В заявку добавлено позиций: ${matches.length}`); }}><ClipboardPlus aria-hidden="true" />Все в заявку</button>}
                <button className="btn btn-ghost" type="button" onClick={() => setPicked([])}>Очистить</button>
              </div>
            </div>

            <ul className="picked-row">
              {pickedColors.map((c) => (
                <li key={c.id} className="picked-chip">
                  <img src={asset(c.swatch)} width={220} height={99} alt="" />
                  <span><b>{c.name}</b><small>{c.code} · {counts.get(c.id) ?? 0} поз.</small></span>
                  <button className="icon-btn" type="button" onClick={() => toggle(c.id)} aria-label={`Убрать оттенок «${c.name}»`}><X aria-hidden="true" /></button>
                </li>
              ))}
            </ul>

            {compare && (
              <div className="compare" role="region" aria-label="Сравнение оттенков">
                {pickedColors.map((c) => (
                  <figure key={c.id} className="compare-item">
                    <img src={asset(c.swatch)} width={220} height={99} alt={`Образец «${c.name}»`} />
                    <span className="compare-bar" style={{ background: c.hex }} />
                    <figcaption>
                      <b>{c.name}</b>
                      <span>Артикул {c.code}</span>
                      <span>{c.groups.map((g) => labels.group(g)).join(', ')}</span>
                      <span className="muted">≈ {c.hex} (приблизительно)</span>
                      {c.inStockAs.length > 0 ? <span>В остатках: {c.inStockAs.join(', ')}</span> : <span className="muted">Нет в таблице остатков</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {matches.length > 0 && <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>{matches.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>}
          </div>
        </section>
      )}
    </>
  );
}
