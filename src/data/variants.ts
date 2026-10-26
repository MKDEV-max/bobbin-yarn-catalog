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
  id: string; colorName: string; colorId: string | null; cardName: string | null; cardCode: string | null; hex: string | null;
  group: string | null; groups: string[]; composition: string | null; tex: number | null; yarnType: string | null;
  stock: { kg: number; date: string | null; source: string }; assorti: string[] | null; notes: string[];
};
export type StockRecord = { composition: string | null; tex: number | null; kg: number; date: string | null };
export type CatalogColor = {
  id: string;                  // для цветов карты — id цвета карты; для цветов только из остатков — транслит названия
  name: string;                // название как в источнике (карта расцветок или таблица остатков)
  code: string | null;         // артикул с карты расцветок
  hex: string | null;          // однотонный образец; null — образца на карте нет
  type: string | null;         // solid / melange / mouline
  group: string | null;
  groups: string[];
  source: 'card' | 'stock';    // откуда цвет: карта расцветок / только таблица остатков
  inCatalogBefore: boolean;    // был ли цвет в каталоге до перехода на конфигурации
  stock: StockRecord[];        // справочно: строки таблицы остатков (на дату файла)
  assorti: string[] | null;
  notes: string[];
  legacyIds: string[];         // прежние id товаров — для перенаправления старых ссылок
};

const normName = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/\.\s+/g, '.').trim();
const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const translit = (s: string) => normName(s).split('').map((c) => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Цвета каталога: все цвета прежнего каталога (позиции таблицы остатков, сгруппированные по цвету)
 * + при includeCardOnly — цвета карты расцветок, которых в остатках не было.
 */
export function buildCatalogColors(products: StockProduct[], cardColors: CardColor[], includeCardOnly: boolean): CatalogColor[] {
  const byKey = new Map<string, CatalogColor>();
  const cardById = new Map(cardColors.map((c) => [c.id, c]));
  for (const p of products) {
    const card = p.colorId ? cardById.get(p.colorId) : undefined;
    const key = card ? `card:${card.id}` : `stock:${normName(p.colorName)}`;
    let c = byKey.get(key);
    if (!c) {
      c = card
        ? { id: card.id, name: card.name, code: card.code, hex: card.hex, type: card.type, group: card.group, groups: card.groups, source: 'card', inCatalogBefore: true, stock: [], assorti: null, notes: [], legacyIds: [] }
        : { id: `s-${translit(p.colorName)}`, name: p.colorName.trim(), code: null, hex: null, type: p.yarnType, group: p.group, groups: p.groups, source: 'stock', inCatalogBefore: true, stock: [], assorti: null, notes: [], legacyIds: [] };
      byKey.set(key, c);
    }
    c.stock.push({ composition: p.composition, tex: p.tex, kg: p.stock.kg, date: p.stock.date });
    c.legacyIds.push(p.id);
    if (p.assorti) c.assorti = p.assorti;
    for (const n of p.notes) if (!c.notes.includes(n)) c.notes.push(n);
  }
  if (includeCardOnly) {
    for (const card of cardColors) {
      if (byKey.has(`card:${card.id}`)) continue;
      byKey.set(`card:${card.id}`, { id: card.id, name: card.name, code: card.code, hex: card.hex, type: card.type, group: card.group, groups: card.groups, source: 'card', inCatalogBefore: false, stock: [], assorti: null, notes: [], legacyIds: [] });
    }
  }
  return [...byKey.values()];
}
