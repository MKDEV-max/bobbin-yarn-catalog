/*
 * Проверка полноты каталога: каждый цвет прежнего каталога сохранён, у каждого цвета ровно 8 конфигураций
 * (16/2 и 32/2 × 30/70, 50/50, 100% ПАН, индивидуальный), индивидуальный состав проверяется, позиции заявки
 * с разными параметрами не склеиваются. Использует те же функции, что сайт (src/data/variants.ts).
 *
 *   npm run verify          (входит в npm run build — сборка не пройдёт, если проверка не пройдена)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPOSITION_OPTIONS, TWISTS, buildCatalogColors, configsFor, requestKey, validateCustom } from '../src/data/variants.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const products = json('src/data/generated/products.json');
const colors = json('src/data/generated/colors.json');
const offers = json('src/data/offers.json');
const includeAll = /includeAllCardColors:\s*true/.test(readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8'));
const errors = [];
const fail = (m) => errors.push(m);

// 1. Цвета прежнего каталога: позиции таблицы остатков, сгруппированные по цвету (как было на сайте)
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/\.\s+/g, '.').trim();
const oldColors = new Map();
for (const p of products) { const k = p.colorId ? `card:${p.colorId}` : `stock:${norm(p.colorName)}`; if (!oldColors.has(k)) oldColors.set(k, p); }

const catalog = buildCatalogColors(products, colors, includeAll, JSON.parse(readFileSync(join(ROOT, 'src/data/color-overrides.json'), 'utf8')));
const ids = new Set();
for (const c of catalog) { if (ids.has(c.id)) fail(`Повторяющийся id цвета: ${c.id}`); ids.add(c.id); }

// 2. Ни один прежний цвет и ни одна прежняя позиция не потеряны
const legacy = new Set(catalog.flatMap((c) => c.legacyIds));
for (const p of products) if (!legacy.has(p.id)) fail(`Позиция прежнего каталога без цвета: ${p.id} («${p.colorName}»)`);
const oldKept = [...oldColors.values()].filter((p) => catalog.some((c) => c.legacyIds.includes(p.id))).length;
if (oldKept !== oldColors.size) fail(`Сохранено ${oldKept} из ${oldColors.size} прежних цветов`);
for (const [k, p] of oldColors) {
  const c = catalog.find((x) => x.legacyIds.includes(p.id));
  // Цвет из остатков может слиться с цветом карты, только если это то же название в другом написании (card-abbr)
  if (c && k.startsWith('stock:') && norm(c.name) !== norm(p.colorName) && c.status !== 'card-abbr') fail(`Название цвета изменено: «${p.colorName}» → «${c.name}»`);
  if (c && !c.stockNames.some((n) => norm(n) === norm(p.colorName))) fail(`Название из остатков потеряно: «${p.colorName}»`);
}
if (includeAll) for (const cc of colors) if (!ids.has(cc.id)) fail(`Цвет карты расцветок не в каталоге: ${cc.name} ${cc.code}`);

// 3. Ровно 8 конфигураций у каждого цвета: каждая скрутка × каждый состав, ключи уникальны
let configTotal = 0, incomplete = 0;
const allKeys = new Set();
for (const c of catalog) {
  const cfg = configsFor(c.id, offers);
  configTotal += cfg.length;
  let ok = cfg.length === 8;
  for (const t of TWISTS) for (const o of COMPOSITION_OPTIONS) {
    const n = cfg.filter((k) => k.twist === t && k.comp === o.id).length;
    if (n !== 1) { ok = false; fail(`${c.name}: скрутка ${t}, состав «${o.label}» — ${n} шт. вместо 1`); }
  }
  for (const k of cfg) { if (allKeys.has(k.key)) { ok = false; fail(`Повторяющийся ключ конфигурации ${k.key}`); } allKeys.add(k.key); }
  // без данных о цене/наличии ничего не выдумывается
  for (const k of cfg) if (!offers[k.key] && (k.priceRub !== null || k.available !== null)) { ok = false; fail(`${k.key}: цена или наличие без данных`); }
  if (!ok) incomplete++;
}
if (TWISTS.length !== 2 || TWISTS.join() !== '16/2,32/2') fail(`Скрутки: ${TWISTS.join(', ')}`);
const expectComps = ['30% шерсть / 70% ПАН', '50% шерсть / 50% ПАН', '100% ПАН', 'Индивидуальный состав'];
if (COMPOSITION_OPTIONS.map((o) => o.label).join('|') !== expectComps.join('|')) fail(`Составы: ${COMPOSITION_OPTIONS.map((o) => o.label).join(', ')}`);
if (/PAD|PAN\b/.test(JSON.stringify(COMPOSITION_OPTIONS))) fail('В названиях составов латиница вместо «ПАН»');

// 4. Индивидуальный состав
const cases = [[['20', '80'], true], [['0', '100'], true], [['100', '0'], true], [['30', '80'], false], [['101', '-1'], false], [['', '80'], false], [['50.5', '49.5'], false], [['60', '30'], false]];
for (const [[w, p], valid] of cases) if (!validateCustom(w, p) !== valid) fail(`Индивидуальный состав ${w}/${p}: ожидалось ${valid ? 'принять' : 'отклонить'}`);

// 5. Позиции заявки: разные скрутка/состав/проценты — разные позиции; одинаковые — одна
const id = catalog[0].id;
const keys = [
  requestKey({ colorId: id, twist: '16/2', comp: 'w30' }), requestKey({ colorId: id, twist: '32/2', comp: 'w50' }),
  requestKey({ colorId: id, twist: '16/2', comp: 'w50' }), requestKey({ colorId: id, twist: '16/2', comp: 'custom', wool: 20, pan: 80 }),
  requestKey({ colorId: id, twist: '16/2', comp: 'custom', wool: 40, pan: 60 }), requestKey({ colorId: id, twist: '32/2', comp: 'custom', wool: 20, pan: 80 }),
];
if (new Set(keys).size !== keys.length) fail('Разные конфигурации одного цвета склеиваются в заявке');
if (requestKey({ colorId: id, twist: '16/2', comp: 'w30' }) !== keys[0]) fail('Одинаковая конфигурация даёт разные позиции');

// Отчёт
// 6. Цвета образцов: каждый образец — из данных; без выдуманных оттенков
const isHex = (h) => /^#[0-9A-F]{6}$/i.test(h);
const cardHex = new Set(colors.map((c) => c.hex.toUpperCase()));
const overrides = JSON.parse(readFileSync(join(ROOT, 'src/data/color-overrides.json'), 'utf8'));
const overrideHex = new Set(Object.values(overrides).flatMap((o) => [o.hex, ...(o.tones ?? [])]).filter(Boolean).map((h) => h.toUpperCase()));
for (const c of catalog) {
  if (c.status === 'unverified') { if (c.tones.length || c.hex) fail(`${c.name}: оттенок без сопоставления`); continue; }
  if (!c.tones.length) fail(`${c.name}: нет образца при статусе ${c.status}`);
  for (const t of c.tones) {
    if (!isHex(t)) fail(`${c.name}: неверный HEX ${t}`);
    else if (!cardHex.has(t.toUpperCase()) && !overrideHex.has(t.toUpperCase())) fail(`${c.name}: оттенок ${t} не с карты расцветок и не из ручного подтверждения`);
  }
}
// Дубли одного цвета из-за написания (регистр, пробелы, сокращения через точку)
const seenNames = new Map();
for (const c of catalog) { const k = norm(c.name).replace(/\./g, '. ').replace(/\s+/g, ' '); if (seenNames.has(k)) fail(`Дубль цвета: «${c.name}» и «${seenNames.get(k)}»`); seenNames.set(k, c.name); }

// Подсказки для ручной проверки: названия карты с тем же корнем (не применяются автоматически)
const roots = (n) => norm(n).split(/[\s.+-]+/).filter((w) => w.length >= 4).map((w) => w.slice(0, 5));
const unverified = catalog.filter((c) => c.status === 'unverified').map((c) => {
  const r = roots(c.name);
  const similar = colors.filter((cc) => roots(cc.name).some((w) => r.includes(w))).map((cc) => `${cc.name} ${cc.code}`);
  return { id: c.id, name: c.name, reason: c.statusNote, similarOnCard: similar };
});
const byStatus = catalog.reduce((m, c) => ({ ...m, [c.status]: (m[c.status] ?? 0) + 1 }), {});
const colorReport = {
  totalColors: catalog.length,
  matchedToCard: (byStatus.card ?? 0) + (byStatus['card-abbr'] ?? 0),
  matchedExact: byStatus.card ?? 0,
  matchedByAbbreviation: catalog.filter((c) => c.status === 'card-abbr').map((c) => `${c.stockNames.join(' / ')} → ${c.name} ${c.code}`),
  composite: catalog.filter((c) => c.status === 'composite').map((c) => `${c.name}: ${c.toneNames.join(', ')}`),
  multiToneCardColors: catalog.filter((c) => c.status === 'card' && c.tones.length > 1).map((c) => `${c.name}: ${c.toneNames.join(' + ')}`),
  manual: catalog.filter((c) => c.status === 'manual').map((c) => c.name),
  withSwatch: catalog.filter((c) => c.tones.length > 0).length,
  withRealPhoto: catalog.filter((c) => c.photo).length,
  withColoredIllustration: catalog.filter((c) => !c.photo && c.tones.length > 0).length,
  withNeutralIllustration: catalog.filter((c) => !c.photo && !c.tones.length).length,
  needsManualCheck: unverified,
};
writeFileSync(join(ROOT, 'data-source', 'color-report.json'), JSON.stringify(colorReport, null, 2) + '\n');

const report = {
  date: new Date().toISOString().slice(0, 10),
  oldCatalogPositions: products.length,
  oldCatalogColors: oldColors.size,
  oldColorsKept: oldKept,
  cardColorsAdded: catalog.filter((c) => !c.inCatalogBefore).length,
  catalogColors: catalog.length,
  configsPerColor: 8,
  configsTotal: configTotal,
  colorsWithoutAll8: incomplete,
  errors,
};
writeFileSync(join(ROOT, 'data-source', 'catalog-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Проверка каталога: прежний каталог — ${report.oldCatalogPositions} позиций, ${report.oldCatalogColors} цветов; сохранено ${report.oldColorsKept}.`);
console.log(`Добавлено цветов карты расцветок: ${report.cardColorsAdded}. Цветов в каталоге: ${report.catalogColors}. Конфигураций: ${report.configsTotal} (по 8 на цвет). Цветов без всех 8 вариантов: ${incomplete}.`);
if (errors.length) { console.log(`Цвета: образцов ${colorReport.withSwatch} из ${colorReport.totalColors}.`); console.error(`ОШИБКИ (${errors.length}):\n- ${errors.slice(0, 30).join('\n- ')}`); process.exit(1); }
console.log(`Цвета: ${colorReport.totalColors}; с карты расцветок ${colorReport.matchedToCard} (из них по сокращению ${colorReport.matchedByAbbreviation.length}); составных ${colorReport.composite.length}; подтверждены вручную ${colorReport.manual.length}.`);
console.log(`Образцы: ${colorReport.withSwatch}; настоящие фото: ${colorReport.withRealPhoto}; цветные иллюстрации: ${colorReport.withColoredIllustration}; оттенок уточняется: ${colorReport.withNeutralIllustration} (список — data-source/color-report.json).`);
console.log('Ошибок нет.');
