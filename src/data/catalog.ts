/*
 * Единый источник данных каталога. Данные — из src/data/generated/*.json
 * (создаются скриптом scripts/import-xlsx.mjs из «карта цветов.xlsx»).
 * Позже этот модуль можно заменить загрузкой из API/базы, сохранив типы.
 */
import rawColors from './generated/colors.json';
import rawProducts from './generated/products.json';
import rawMeta from './generated/meta.json';
import { COLOR_GROUPS, COMPOSITIONS, PURPOSES, YARN_TYPES, labelOf } from './taxonomy';
import { site } from '../config/site';
import rawOffers from './offers.json';
import { buildCatalogColors, configsFor, type CatalogColor, type Offer } from './variants';
export type { CatalogColor } from './variants';

export type YarnType = 'solid' | 'melange' | 'mouline';

export type Color = {
  id: string;
  name: string;            // название с карты расцветок, без изменений
  code: string;            // артикул с карты
  hex: string;             // цвет образца: замер по фото карты расцветок из Excel (приблизительный)
  hexApproximate: boolean;
  type: YarnType;
  group: string | null;
  groups: string[];
  inStockAs: string[];     // названия этого цвета в таблице остатков
  note?: string;
};

export type Product = {
  id: string;
  colorName: string;       // название в таблице остатков, без изменений
  colorId: string | null;
  colorMatch: 'exact' | 'abbr' | null;
  cardName: string | null;
  cardCode: string | null;
  hex: string | null;
  group: string | null;
  groups: string[];
  composition: string | null;
  compositionSource: string | null;
  categories: string[];
  fibers: string[];
  tex: number | null;
  nm: number | null;
  ply: number | null;
  bobbinWeightKg: number | null;
  priceRub: number | null;
  minOrder: string | null;
  yarnType: YarnType | null;
  purpose: string[];
  stock: { kg: number; date: string | null; source: string };
  assorti: string[] | null;
  notes: string[];
};

export type Meta = typeof rawMeta;

export const COLORS = rawColors as Color[];
export const PRODUCTS = rawProducts as Product[];
export const META = rawMeta as Meta;

export const colorById = new Map(COLORS.map((c) => [c.id, c]));
export const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

/* ---------- Каталог по цветам: одна карточка = один цвет, у каждого 8 конфигураций (см. variants.ts) ---------- */
export const OFFERS = rawOffers as Record<string, Offer>;
export const CATALOG: CatalogColor[] = buildCatalogColors(PRODUCTS, COLORS, site.catalog.includeAllCardColors);
export const catalogById = new Map(CATALOG.map((c) => [c.id, c]));
/** Старые ссылки /product/<id позиции> → цвет */
export const legacyToColor = new Map(CATALOG.flatMap((c) => c.legacyIds.map((id) => [id, c.id] as const)));
export const colorConfigs = (c: CatalogColor) => configsFor(c.id, OFFERS);
export const capName = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const colorTitle = (c: CatalogColor) => `${capName(c.name.trim())}${c.code ? ` · ${c.code}` : ''}`;
export function colorSearchText(c: CatalogColor) {
  return [c.name, c.code, ...c.groups.map((g) => labelOf(COLOR_GROUPS, g))].filter(Boolean).join(' ').toLowerCase().replace(/ё/g, 'е');
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Короткое название материала для заголовка карточки — только из известного состава */
export function materialShort(p: Product) {
  if (p.categories.includes('half-wool')) return 'Полушерсть';
  if (p.categories.includes('acrylic')) return 'Акрил';
  return 'Пряжа';
}
export function productTitle(p: Product) {
  return `${materialShort(p)} «${cap(p.colorName.trim())}»${p.tex ? `, ${p.tex} текс` : ''}`;
}
export function productSubtitle(p: Product) {
  return p.composition ?? 'Состав уточняется';
}

/** Наличие: остатки из таблицы — справочные. «В наличии» — только если дата остатков не раньше site.stock.freshUntil */
export function stockStatus(p: Product): { label: string; tone: 'ok' | 'check' } {
  const fresh = site.stock.freshUntil && p.stock.date && p.stock.date >= site.stock.freshUntil && p.stock.kg > 0;
  return fresh ? { label: 'В наличии', tone: 'ok' } : { label: 'Уточнить наличие', tone: 'check' };
}
export const formatDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('.') : '');
export const formatKg = (kg: number) => `${kg.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} кг`;

/** Очень светлый цвет — образцу нужна тонкая рамка, иначе он сливается с белым фоном */
export function isLight(hex: string | null) {
  if (!hex) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.72;
}

export function hueOf(hex: string | null) {
  if (!hex) return 999;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  if (d < 0.06) return 400 + l;                    // ахроматические — в конец, по светлоте
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function searchText(p: Product) {
  return [p.colorName, p.cardName, p.cardCode, p.composition, materialShort(p), p.tex && `${p.tex} текс`,
    ...p.groups.map((g) => labelOf(COLOR_GROUPS, g))].filter(Boolean).join(' ').toLowerCase().replace(/ё/g, 'е');
}

/** Цвет группы для интерфейса — медианный по реальным цветам группы (не произвольный) */
export const groupSwatch: Record<string, string> = Object.fromEntries(COLOR_GROUPS.map((g) => {
  const list = COLORS.filter((c) => c.group === g.id).map((c) => c.hex).sort((a, b) => hueOf(a) - hueOf(b));
  return [g.id, list[list.length >> 1] ?? '#CCCCCC'];
}));

export const labels = {
  composition: (id: string) => labelOf(COMPOSITIONS, id),
  type: (id: string) => labelOf(YARN_TYPES, id),
  purpose: (id: string) => labelOf(PURPOSES, id),
  group: (id: string) => labelOf(COLOR_GROUPS, id),
};
