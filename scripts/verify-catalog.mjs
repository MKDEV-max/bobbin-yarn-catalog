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

const catalog = buildCatalogColors(products, colors, includeAll);
const ids = new Set();
for (const c of catalog) { if (ids.has(c.id)) fail(`Повторяющийся id цвета: ${c.id}`); ids.add(c.id); }

// 2. Ни один прежний цвет и ни одна прежняя позиция не потеряны
const legacy = new Set(catalog.flatMap((c) => c.legacyIds));
for (const p of products) if (!legacy.has(p.id)) fail(`Позиция прежнего каталога без цвета: ${p.id} («${p.colorName}»)`);
const oldKept = [...oldColors.values()].filter((p) => catalog.some((c) => c.legacyIds.includes(p.id))).length;
if (oldKept !== oldColors.size) fail(`Сохранено ${oldKept} из ${oldColors.size} прежних цветов`);
for (const [k, p] of oldColors) {
  const c = catalog.find((x) => x.legacyIds.includes(p.id));
  if (c && k.startsWith('stock:') && norm(c.name) !== norm(p.colorName)) fail(`Название цвета изменено: «${p.colorName}» → «${c.name}»`);
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
if (errors.length) { console.error(`ОШИБКИ (${errors.length}):\n- ${errors.slice(0, 30).join('\n- ')}`); process.exit(1); }
console.log('Ошибок нет.');
