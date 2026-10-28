/*
 * Модель каталога: одна карточка = один цвет; у каждого цвета 8 конфигураций —
 * 2 скрутки (16/2, 32/2) × 4 состава (30/70, 50/50, 100% ПАН, индивидуальный).
 *
 * Модуль без импортов и без JSON — его же запускает scripts/verify-catalog.mjs для проверки полноты.
 * Цены и наличие по конкретной комбинации задаются в src/data/offers.json (ключ — configKey);
 * пока сведений нет, интерфейс показывает «Цена по запросу» и не утверждает наличие.
 */

export const TWISTS = ['16/2', '32/2'] as const;
export type Twist = (typeof TWISTS)[number];

export type CompId = 'w30' | 'w50' | 'pan100' | 'custom';
export type CompOption = { id: CompId; label: string; short: string; note?: string; wool: number | null; pan: number | null };
export const COMPOSITION_OPTIONS: CompOption[] = [
  { id: 'w30', label: '30% шерсть / 70% ПАН', short: '30/70', wool: 30, pan: 70 },
  { id: 'w50', label: '50% шерсть / 50% ПАН', short: '50/50', wool: 50, pan: 50 },
  { id: 'pan100', label: '100% ПАН', short: '100% ПАН', note: 'высококачественное акриловое волокно', wool: 0, pan: 100 },
  { id: 'custom', label: 'Индивидуальный состав', short: 'Свой состав', wool: null, pan: null },
];
export const compById = (id: string) => COMPOSITION_OPTIONS.find((c) => c.id === id);

/** Ключ конфигурации «цвет + скрутка + состав» — по нему задаются цена и наличие в offers.json */
export const configKey = (colorId: string, twist: Twist, comp: CompId) => `${colorId}|${twist}|${comp}`;

export type Offer = { priceRub?: number | null; available?: boolean | null; note?: string };
export type Config = { key: string; colorId: string; twist: Twist; comp: CompId; priceRub: number | null; available: boolean | null };

/** Все 8 конфигураций цвета: каждая скрутка × каждый состав */
export function configsFor(colorId: string, offers: Record<string, Offer> = {}): Config[] {
  return TWISTS.flatMap((twist) => COMPOSITION_OPTIONS.map((c) => {
    const key = configKey(colorId, twist, c.id);
    const o = offers[key] ?? {};
    return { key, colorId, twist, comp: c.id, priceRub: o.priceRub ?? null, available: o.available ?? null };
  }));
}

/** Проверка индивидуального состава: целые 0–100, сумма ровно 100. Возвращает текст ошибки или '' */
export function validateCustom(wool: string, pan: string): string {
  if (wool.trim() === '' || pan.trim() === '') return 'Укажите проценты шерсти и ПАН';
  const w = Number(wool), p = Number(pan);
  if (!Number.isInteger(w) || !Number.isInteger(p)) return 'Проценты — целые числа';
  if (w < 0 || w > 100 || p < 0 || p > 100) return 'Каждое значение — от 0 до 100';
  if (w + p !== 100) return `Сумма должна быть 100%, сейчас ${w + p}%`;
  return '';
}

/** Ключ позиции заявки: одинаковые цвет, скрутка, состав (и проценты) — одна позиция; любые отличия — разные */
export const requestKey = (c: { colorId: string; twist: Twist; comp: CompId; wool?: number | null; pan?: number | null }) =>
  [c.colorId, c.twist, c.comp, c.comp === 'custom' ? `${c.wool}-${c.pan}` : ''].join('|');

/** Текст состава для заявки и карточек */
export function compText(comp: CompId, wool?: string | number | null, pan?: string | number | null) {
  const c = compById(comp)!;
  if (comp === 'custom') return `Индивидуальный: ${wool}% шерсть / ${pan}% ПАН`;
  return c.note ? `${c.label} — ${c.note}` : c.label;
}

/* ---------- Цвета каталога из данных Excel ---------- */

type CardColor = { id: string; name: string; code: string; hex: string; type: string; group: string | null; groups: string[] };
type StockProduct = {
  id: string; colorName: string; colorId: string | null; colorMatch?: string | null; cardName: string | null; cardCode: string | null; hex: string | null;
  group: string | null; groups: string[]; composition: string | null; tex: number | null; yarnType: string | null;
  stock: { kg: number; date: string | null; source: string }; assorti: string[] | null; notes: string[];
};
export type StockRecord = { composition: string | null; tex: number | null; kg: number; date: string | null };
/**
 * Откуда взят цвет образца:
 *  card       — цвет есть на карте расцветок (точное название);
 *  card-abbr  — название в остатках — сокращение (или полная форма) названия на карте; сопоставление проверено вручную;
 *  composite  — составной цвет («Ассорти», «A+B»): несколько оттенков, каждый — с карты расцветок;
 *  unverified — на карте расцветок такого цвета нет: оттенок не выдумываем, нужна ручная проверка.
 *  manual     — цвет подтверждён владельцем в src/data/color-overrides.json (по карте, образцу или фото).
 */
export type ColorStatus = 'card' | 'card-abbr' | 'composite' | 'manual' | 'unverified';
export type CatalogColor = {
  id: string;                  // для цветов карты — id цвета карты; для цветов только из остатков — «s-» + транслит названия
  name: string;                // название как в источнике (карта расцветок или таблица остатков)
  code: string | null;         // артикул с карты расцветок
  hex: string | null;          // основной оттенок (замер по фото карты); null — оттенок не определён
  tones: string[];             // все оттенки образца: [hex] для однотонных, 2+ для составных, [] — не определён
  toneNames: string[];         // названия оттенков с карты — для подписи составного образца
  status: ColorStatus;
  statusNote: string;          // пояснение для ручной проверки / сопоставления
  photo: string | null;        // путь к настоящей фотографии бобины этого цвета (в public/); пока фото нет
  type: string | null;         // solid / melange / mouline
  group: string | null;
  groups: string[];
  source: 'card' | 'stock';    // откуда цвет: карта расцветок / только таблица остатков
  inCatalogBefore: boolean;    // был ли цвет в каталоге до перехода на конфигурации
  stock: StockRecord[];        // справочно: строки таблицы остатков (на дату файла)
  stockNames: string[];        // как цвет записан в таблице остатков (все написания)
  assorti: string[] | null;
  notes: string[];
  legacyIds: string[];         // прежние id (позиций и цветов) — для перенаправления старых ссылок
};

const normName = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/\.\s+/g, '.').trim();
const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const translit = (s: string) => normName(s).split('').map((c) => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** id цвета, который есть только в таблице остатков (так он назывался на сайте до сопоставления) */
export const stockColorId = (name: string) => `s-${translit(name)}`;

/** Составной цвет: «A+B» или «Ассорти» (по расшифровке из Excel) — оттенки только тех составляющих, что есть на карте */
function compositeTones(name: string, assorti: string[] | null, cardByNorm: Map<string, CardColor>) {
  const n = normName(name);
  const parts = n.includes('+') ? n.split('+').map((x) => x.trim()) : /ассорти/.test(n) && assorti ? assorti.map(normName) : [];
  const found = parts.map((x) => cardByNorm.get(x)).filter((c): c is CardColor => !!c);
  const uniq = [...new Map(found.map((c) => [c.id, c])).values()];
  return { parts, found: uniq };
}

/**
 * Цвета каталога: все цвета прежнего каталога (позиции таблицы остатков, сгруппированные по цвету)
 * + при includeCardOnly — цвета карты расцветок, которых в остатках не было.
 */
/**
 * Ручные подтверждения (src/data/color-overrides.json). Ключ — id цвета каталога или его название в таблице остатков.
 *   { "Брусничный": { "card": "brusnika", "note": "сверено с образцом" } }   — оттенок цвета карты расцветок
 *   { "s-aurora-krasnaya": { "hex": "#B3262E", "note": "замер по образцу" } } — свой замер
 *   { "biryuza": { "photo": "photos/biryuza.jpg" } }                            — настоящее фото бобины (public/)
 */
export type ColorOverride = { card?: string; hex?: string; tones?: string[]; photo?: string; note?: string };

export function buildCatalogColors(products: StockProduct[], cardColors: CardColor[], includeCardOnly: boolean, overrides: Record<string, ColorOverride> = {}): CatalogColor[] {
  const byKey = new Map<string, CatalogColor>();
  const cardById = new Map(cardColors.map((c) => [c.id, c]));
  const cardByNorm = new Map(cardColors.map((c) => [normName(c.name), c]));
  const fromCard = (card: CardColor, inCatalogBefore: boolean): CatalogColor => ({
    id: card.id, name: card.name, code: card.code, hex: card.hex, tones: [card.hex], toneNames: [card.name], status: 'card', statusNote: '', photo: null,
    type: card.type, group: card.group, groups: card.groups, source: 'card', inCatalogBefore, stock: [], stockNames: [], assorti: null, notes: [], legacyIds: [],
  });
  for (const p of products) {
    const card = p.colorId ? cardById.get(p.colorId) : undefined;
    const key = card ? `card:${card.id}` : `stock:${normName(p.colorName)}`;
    let c = byKey.get(key);
    if (!c) {
      c = card ? fromCard(card, true) : {
        id: stockColorId(p.colorName), name: p.colorName.trim(), code: null, hex: null, tones: [], toneNames: [], status: 'unverified',
        statusNote: 'Цвета с таким названием нет на карте расцветок в «карта цветов.xlsx» — оттенок не определён, нужна ручная проверка (образец или фото).',
        photo: null, type: p.yarnType, group: p.group, groups: p.groups, source: 'stock', inCatalogBefore: true, stock: [], stockNames: [], assorti: null, notes: [], legacyIds: [],
      };
      byKey.set(key, c);
    }
    if (card && p.colorMatch === 'abbr' && c.status === 'card') {
      c.status = 'card-abbr';
      c.statusNote = `В таблице остатков записан как «${p.colorName.trim()}», на карте расцветок — «${card.name}» ${card.code}.`;
    }
    // Цвет раньше был отдельной карточкой «только из остатков» — его старый адрес ведёт сюда
    if (card) { const old = stockColorId(p.colorName); if (old !== c.id && !c.legacyIds.includes(old)) c.legacyIds.push(old); }
    if (!c.stockNames.includes(p.colorName.trim())) c.stockNames.push(p.colorName.trim());
    c.stock.push({ composition: p.composition, tex: p.tex, kg: p.stock.kg, date: p.stock.date });
    c.legacyIds.push(p.id);
    // У «Ассорти» две расшифровки (ПАН и полушерсть) — объединяем
    if (p.assorti) c.assorti = [...new Set([...(c.assorti ?? []), ...p.assorti])];
    for (const n of p.notes) if (!c.notes.includes(n)) c.notes.push(n);
  }
  if (includeCardOnly) {
    for (const card of cardColors) if (!byKey.has(`card:${card.id}`)) byKey.set(`card:${card.id}`, fromCard(card, false));
  }
  // Составные цвета: образец из оттенков составляющих, если они есть на карте расцветок
  for (const c of byKey.values()) {
    const { parts, found } = compositeTones(c.name, c.assorti, cardByNorm);
    if (!parts.length) continue;
    if (c.source === 'card' && found.length === parts.length && found.length >= 2) {
      // мулине с карты: замер фото + оттенки обеих нитей
      c.tones = found.map((x) => x.hex); c.toneNames = found.map((x) => x.name);
    } else if (c.source === 'stock' && found.length >= 2 && (n2(c.name).includes('+') ? found.length === parts.length : true)) {
      c.tones = found.slice(0, 8).map((x) => x.hex); c.toneNames = found.slice(0, 8).map((x) => x.name);
      c.hex = c.tones[0]; c.status = 'composite';
      c.statusNote = n2(c.name).includes('+')
        ? `Составной цвет: ${found.map((x) => `«${x.name}» ${x.code}`).join(' + ')} — оттенки с карты расцветок.`
        : `Смесь расцветок по расшифровке «Ассорти» в Excel. На образце — ${c.toneNames.length} из ${parts.length} цветов смеси, которые есть на карте расцветок.`;
    } else if (c.source === 'stock') {
      const missing = parts.filter((x) => !cardByNorm.has(x));
      c.statusNote = `Составной цвет; на карте расцветок нет: ${missing.map((x) => `«${x}»`).join(', ')} — оттенок не определён, нужна ручная проверка.`;
    }
  }
  // Ручные подтверждения владельца
  const ov = new Map(Object.entries(overrides).map(([k, v]) => [normName(k), v]));
  for (const c of byKey.values()) {
    const o = ov.get(normName(c.id)) ?? ov.get(normName(c.name)) ?? c.stockNames.map((n) => ov.get(normName(n))).find(Boolean);
    if (!o) continue;
    if (o.photo) c.photo = o.photo;
    const card = o.card ? cardById.get(o.card) : undefined;
    const tones = o.tones?.length ? o.tones : card ? [card.hex] : o.hex ? [o.hex] : null;
    if (tones) {
      c.tones = tones; c.hex = tones[0]; c.toneNames = card ? [card.name] : [c.name]; c.status = 'manual';
      c.statusNote = `Цвет подтверждён вручную${card ? `: оттенок «${card.name}» ${card.code} с карты расцветок` : ''}${o.note ? ` (${o.note})` : ''}.`;
    }
  }
  return [...byKey.values()];
}
const n2 = normName;
