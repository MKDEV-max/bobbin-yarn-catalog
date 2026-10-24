/*
 * Импорт данных из «карта цветов.xlsx» → JSON для сайта + образцы цветов.
 *
 *   npm run import-data                     (ищет ../карта цветов.xlsx)
 *   npm run import-data -- путь/к/файлу.xlsx
 *
 * Исходный Excel не изменяется и в репозиторий не попадает (.gitignore).
 * На выходе:
 *   src/data/generated/colors.json    — палитра: названия и артикулы с карты, приблизительный HEX, образец
 *   src/data/generated/products.json  — позиции из таблиц остатков (состав, текс, остаток на дату)
 *   src/data/generated/meta.json      — дата остатков, источники, расшифровка «Ассорти»
 *   public/swatches/*.webp            — вырезанные с карты образцы мотков
 *
 * Правила (см. README): ничего не угадываем. Состав — только из заголовка столбца таблицы.
 * Сопоставление «название на складе ↔ образец на карте» — только точное совпадение после
 * нормализации (регистр, ё/е, пробелы) или явное сокращение того же названия из ABBR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { XMLParser } from 'fast-xml-parser';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(process.argv[2] || path.join(ROOT, '..', 'карта цветов.xlsx'));
const OUT_DATA = path.join(ROOT, 'src', 'data', 'generated');
const OUT_SW = path.join(ROOT, 'public', 'swatches');
const CARD = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-source', 'color-card.json'), 'utf8'));

if (!fs.existsSync(SRC)) { console.error('Не найден файл:', SRC); process.exit(1); }
fs.mkdirSync(OUT_DATA, { recursive: true });
fs.mkdirSync(OUT_SW, { recursive: true });

// ---------- Чтение xlsx ----------
const zip = unzipSync(new Uint8Array(fs.readFileSync(SRC)));
const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', textNodeName: '#text', isArray: (n) => ['si', 'r', 'row', 'c', 'sheet', 'Relationship'].includes(n) });
const read = (p) => xml.parse(strFromU8(zip[p]));

const shared = (read('xl/sharedStrings.xml').sst.si || []).map((si) => {
  if (si.t !== undefined) return typeof si.t === 'object' ? si.t['#text'] ?? '' : String(si.t);
  return (si.r || []).map((r) => (typeof r.t === 'object' ? r.t['#text'] ?? '' : String(r.t ?? ''))).join('');
});
const rels = Object.fromEntries(read('xl/_rels/workbook.xml.rels').Relationships.Relationship.map((r) => [r.Id, r.Target]));
const sheets = {};
for (const s of read('xl/workbook.xml').workbook.sheets.sheet) {
  const rows = read('xl/' + rels[s['r:id']]).worksheet.sheetData.row || [];
  const cells = {};
  for (const row of rows) for (const c of row.c || []) {
    let v = c.v;
    if (v === undefined || v === '') continue;
    v = typeof v === 'object' ? v['#text'] : v;
    if (c.t === 's') v = shared[Number(v)];
    cells[c.r] = typeof v === 'string' ? v : Number(v);
  }
  sheets[s.name] = cells;
}
const SHEET = { decode: 'Расшифровка "Ассорти"', stock: 'Наличие бобин', sums: 'Сумма остатков', card: 'карта расцеток пряжи' };
for (const k of Object.values(SHEET)) if (!sheets[k]) { console.error('Нет листа:', k, Object.keys(sheets)); process.exit(1); }

const excelDate = (n) => new Date(Date.UTC(1899, 11, 30) + n * 86400000).toISOString().slice(0, 10);
const num = (v) => (typeof v === 'number' ? v : v && !isNaN(parseFloat(v)) ? parseFloat(v) : null);
const round = (v) => Math.round(v * 100) / 100;

// ---------- Нормализация названий ----------
const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/\.\s+/g, '.').replace(/\s*\+\s*/g, '+').trim();
// Явные сокращения того же названия (слово обрезано точкой) — не «похожие» названия.
const ABBR = {
  'горьк.шоколад': 'горький шоколад',
  'изумр.город': 'изумрудный город',
  'кокос.молоко': 'кокосовое молоко',
  'мятн.свежесть': 'мятная свежесть',
  'черн.жемчуг': 'черный жемчуг',
};
const translit = (s) => {
  const m = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  return norm(s).split('').map((c) => m[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

// ---------- Остатки: лист «Наличие бобин» ----------
const st = sheets[SHEET.stock];
const stockDate = typeof st.C3 === 'number' ? excelDate(st.C3) : null;
const stockTitle = String(st.A3 || '').trim();
const COMP = {};                                     // столбец → состав по заголовку
for (const col of ['B', 'C']) COMP[col] = String(st[col + '5'] || '').trim();
const entries = [];                                  // { name, composition, tex, kg, source, date }
for (let r = 7; r < 400; r++) {
  const name = st['A' + r];
  if (name === undefined) continue;
  if (/^итого/i.test(String(name).trim())) break;
  for (const col of ['B', 'C']) {
    const kg = num(st[col + r]);
    if (kg && kg > 0) entries.push({ name: String(name).trim(), composition: COMP[col], tex: null, kg: round(kg), source: `${SHEET.stock}, строка ${r}`, date: stockDate, purpose: stockTitle });
  }
}
const stockNames = [];                               // все названия из столбца A, включая строки без остатка
for (let r = 7; r < 400; r++) { const n = st['A' + r]; if (n === undefined) continue; if (/^итого/i.test(String(n))) break; if (String(n).trim()) stockNames.push(String(n).trim()); }

// ---------- Остатки: лист «Сумма остатков» (по линейной плотности) ----------
const sm = sheets[SHEET.sums];
const smRows = [...new Set(Object.keys(sm).map((k) => Number(k.replace(/^[A-Z]+/, ''))))].sort((a, b) => a - b);
const headers = smRows.filter((r) => /Цвет пряжи/i.test(String(sm['B' + r] || '')));
const split = [], combined = [];
for (const h of headers) {
  let tex = null;                                    // ближайшая сверху подпись «NNN текс» или в заголовке столбца
  for (let r = h; r >= Math.max(1, h - 6) && !tex; r--) for (const col of ['B', 'C']) { const m = String(sm[col + r] || '').match(/(\d+)\s*текс/i); if (m) { tex = Number(m[1]); break; } }
  const cols = ['C', 'D'].filter((c) => sm[c + h] && !/итого/i.test(String(sm[c + h])));
  for (let r = h + 2; r < h + 60; r++) {
    const name = sm['B' + r];
    if (name === undefined || /итого/i.test(String(name))) break;
    for (const col of cols) {
      const head = String(sm[col + h]).trim(), kg = num(sm[col + r]);
      if (!kg || kg <= 0) continue;
      const isComp = /%/.test(head);
      (isComp ? split : combined).push({ name: String(name).trim(), composition: isComp ? head : null, tex, kg: round(kg), source: `${SHEET.sums}, строка ${r}`, date: null, purpose: null });
    }
  }
}
// Таблицы «итого по тексу» дублируют разбивку по составам; берём из них только то, чего нет в разбивке.
for (const c of combined) if (!split.some((s) => norm(s.name) === norm(c.name) && s.tex === c.tex)) split.push(c);
entries.push(...split);

// ---------- Расшифровка «Ассорти» ----------
const dc = sheets[SHEET.decode];
const assorti = { title: String(dc.B3 || '').trim(), columns: [] };
for (const col of ['B', 'C']) {
  const head = String(dc[col + '5'] || '').trim();
  const list = [];
  for (let r = 6; r < 100; r++) if (dc[col + r]) list.push(String(dc[col + r]).trim());
  assorti.columns.push({ label: head, list });
}

// ---------- Карта расцветок: образцы и HEX ----------
const media = (n) => Buffer.from(zip[`xl/media/image${n}.jpeg`]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

const colors = [];
const seenSlug = new Set();
for (const block of CARD.images) {
  const buf = media(block.image);
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  // Фон — светло-серый: медиана правого края фото
  const bgS = [];
  for (let y = 0; y < H; y += 7) bgS.push(px(W - 3, y));
  const bg = [0, 1, 2].map((k) => bgS.map((p) => p[k]).sort((a, b) => a - b)[bgS.length >> 1]);
  const isYarn = (p) => dist(p, bg) > 38;
  // Колонка мотков — левая треть фото; правая граница — последний столбец с заметной долей «пряжи»
  const maxX = Math.floor(W * 0.42);
  const colShare = [];
  for (let x = 0; x < maxX; x++) { let n = 0; for (let y = 0; y < H; y += 3) if (isYarn(px(x, y))) n++; colShare.push(n / (H / 3)); }
  // Левая граница — первый столбец с мотками; правая — начало пустого промежутка между мотками и подписями
  let x0 = colShare.findIndex((v) => v > 0.15), x1 = x0 + 20;
  while (x1 < maxX - 1 && colShare[x1 + 1] > 0.04) x1++;
  // Вертикальные границы
  let bands = block.bands;
  if (!bands) {
    const rowYarn = (y) => { let n = 0; for (let x = x0; x <= x1; x += 2) if (isYarn(px(x, y))) n++; return n / ((x1 - x0) / 2 + 1); };
    let y0 = 0, y1 = H - 1;
    while (y0 < H && rowYarn(y0) < 0.25) y0++;
    while (y1 > y0 && rowYarn(y1) < 0.25) y1--;
    bands = [[y0, y1]];
  }
  const [b0, b1] = bands[0], step = (b1 - b0) / block.colors.length;
  for (let i = 0; i < block.colors.length; i++) {
    const [name, code] = block.colors[i];
    const top = Math.round(b0 + i * step), bot = Math.round(b0 + (i + 1) * step);
    // Замер: средняя полоса по высоте, левая и правая «петли» моточка (центральную перетяжку пропускаем)
    const sample = [];
    const w = x1 - x0;
    for (let y = Math.round(top + step * 0.3); y < bot - step * 0.3; y++) {
      for (let x = Math.round(x0 + w * 0.08); x < x0 + w * 0.92; x++) {
        if (x > x0 + w * 0.4 && x < x0 + w * 0.6) continue;
        const p = px(x, y);
        if (isYarn(p)) sample.push(p);
      }
    }
    const raw = [0, 1, 2].map((k) => { const a = sample.map((p) => p[k]).sort((m, n) => m - n); return a[a.length >> 1] ?? 0; });
    // Баланс белого по фону карты: светло-серый фон фото приводим к почти белому (242),
    // иначе белые и светлые оттенки выходят серыми. HEX всё равно приблизительный.
    const med = raw.map((v, k) => Math.min(255, v * 242 / Math.max(1, bg[k])));
    let slug = translit(name);
    while (seenSlug.has(slug)) slug += '-2';
    seenSlug.add(slug);
    const pad = Math.round(step * 0.08);
    await sharp(buf).extract({ left: Math.max(0, x0), top: Math.max(0, top - pad), width: Math.min(W - x0, w + 1), height: Math.min(H - Math.max(0, top - pad), Math.round(step + 2 * pad)) })
      .resize({ width: 220 }).webp({ quality: 78 }).toFile(path.join(OUT_SW, slug + '.webp'));
    colors.push({ id: slug, name, code, hex: toHex(med), hexRaw: toHex(raw), hexApproximate: true, type: block.type, cardImage: block.image, swatch: `swatches/${slug}.webp`, samples: sample.length });
  }
}

// ---------- Группы оттенков (для навигации) ----------
function groupOf(c) {
  const n = norm(c.name);
  if (/(^|\s)(суров|натурал)/.test(n)) return 'natural';
  if (c.type === 'mouline' || n.includes('+') || /ассорти/.test(n)) return 'multi';
  if (c.type === 'melange' || /меланж/.test(n)) return 'melange';
  if (!c.hex) return null;
  const rgb = [1, 3, 5].map((i) => parseInt(c.hex.slice(i, i + 2), 16));
  const [h, s, l] = hsl(rgb);
  if (/(^|[\s.-])(супер)?бел/.test(n) && l > 0.7) return 'white';
  if (l < 0.1 || (l < 0.16 && s < 0.18)) return 'black';
  if (l > 0.82 && s < 0.35) return h > 30 && h < 70 && s > 0.12 ? 'cream' : 'white';
  if (s < 0.13) return l < 0.2 ? 'black' : 'grey';
  if (h < 12 || h >= 345) return l > 0.62 ? 'pink' : 'red';
  if (h < 40) { if (l < 0.32) return 'brown'; if (s < 0.4) return l > 0.55 ? 'cream' : l < 0.42 ? 'brown' : 'sand'; return 'orange'; }
  if (h < 68) { if (l < 0.3) return 'brown'; if (s < 0.42) return l > 0.7 ? 'cream' : 'sand'; return 'yellow'; }
  if (h < 160) return 'green';
  if (h < 195) return 'turquoise';
  if (h < 255) return l < 0.17 ? 'black' : 'blue';
  if (h < 295) return 'violet';
  return l > 0.5 ? 'pink' : l < 0.3 ? 'red' : 'pink';
}

// ---------- Сопоставление названий со склада и карты ----------
const byNorm = new Map(colors.map((c) => [norm(c.name), c]));
function matchColor(stockName) {
  const n = norm(stockName);
  if (byNorm.has(n)) return { color: byNorm.get(n), how: 'exact' };
  if (ABBR[n] && byNorm.has(ABBR[n])) return { color: byNorm.get(ABBR[n]), how: 'abbr' };
  return null;
}
// Группа для названий без образца на карте — только по явному цветовому слову в названии
const WORD_GROUPS = [[/черн/, 'black'], [/бел/, 'white'], [/сер(ый|ая)|асфальт|антрацит|графит|маренго/, 'grey'], [/синий|син\b|синь/, 'blue'], [/голуб/, 'blue'],
  [/бирюз/, 'turquoise'], [/зелен|олив/, 'green'], [/бордов/, 'red'], [/красн/, 'red'], [/розов/, 'pink'], [/сирен|лилов|фиолет/, 'violet'],
  [/коричн|шоколад|кофе/, 'brown'], [/желт|золот/, 'yellow'], [/оранж|терракот/, 'orange'], [/бежев|песоч/, 'sand']];
const wordGroup = (name) => { const n = norm(name); if (/(^|\s)(суров|натурал)/.test(n)) return 'natural'; if (/ассорти|\+/.test(n)) return 'multi'; if (/меланж|(^|\s)м\./.test(n) && /меланж/.test(n)) return 'melange'; for (const [re, g] of WORD_GROUPS) if (re.test(n)) return g; return null; };

// Группы цвета: по замеру с фото + по явному цветовому слову в названии (например «т.синий» — и чёрные, и синие)
for (const c of colors) {
  c.group = groupOf(c);
  const ng = wordGroup(c.name);
  c.groups = [...new Set([c.group, ng].filter(Boolean))];
}
const COMPOSITIONS = {
  'Шерсть-30%, ПАН-70%': { label: 'Шерсть 30%, ПАН 70%', categories: ['wool-acrylic', 'half-wool'], fibers: ['шерсть', 'акрил (ПАН)'] },
  'ПАН-100%': { label: 'ПАН 100% (акрил)', categories: ['acrylic'], fibers: ['акрил (ПАН)'] },
};

// ---------- Позиции каталога ----------
const products = [];
const ids = new Set();
for (const e of entries) {
  const m = matchColor(e.name);
  const comp = e.composition ? COMPOSITIONS[e.composition] : null;
  const base = `${translit(e.name)}-${comp ? translit(comp.label.split(' (')[0]) : 'sostav-utochnyaetsya'}${e.tex ? '-' + e.tex + 'tex' : ''}`;
  let id = base; while (ids.has(id)) id += '-2'; ids.add(id);
  const isAssorti = /ассорти/i.test(e.name);
  products.push({
    id,
    colorName: e.name,                                // исходное название со склада — без изменений
    colorId: m ? m.color.id : null,
    colorMatch: m ? m.how : null,
    cardName: m ? m.color.name : null,
    cardCode: m ? m.color.code : null,
    hex: m ? m.color.hex : null,
    group: m ? m.color.group : wordGroup(e.name),
    groups: m ? m.color.groups : [wordGroup(e.name)].filter(Boolean),
    composition: comp ? comp.label : null,
    compositionSource: e.composition,
    categories: comp ? comp.categories : [],
    fibers: comp ? comp.fibers : [],
    tex: e.tex,
    nm: e.tex ? Math.round((1000 / e.tex) * 100) / 100 : null,
    ply: null,
    bobbinWeightKg: null,
    priceRub: null,
    minOrder: null,
    yarnType: m ? m.color.type : (/меланж/i.test(e.name) ? 'melange' : null),
    purpose: e.purpose ? ['machine'] : [],
    stock: { kg: e.kg, date: e.date, source: e.source },
    assorti: isAssorti ? (assorti.columns.find((c) => (e.composition === 'ПАН-100%' && /пан/i.test(c.label)) || (e.composition && /шерст/i.test(e.composition) && /пш/i.test(c.label)))?.list ?? null) : null,
    notes: [],
  });
}
// Пометки о похожих строках в таблице (не объединяем — сохраняем как есть)
for (const p of products) {
  const twins = products.filter((q) => q !== p && q.compositionSource === p.compositionSource && q.tex === p.tex && norm(q.colorName).replace(/[\s.]/g, '') === norm(p.colorName).replace(/[\s.]/g, '') && q.colorName !== p.colorName);
  if (twins.length) p.notes.push(`В таблице остатков есть строка с близким написанием: «${twins.map((t) => t.colorName).join('», «')}». Уточните, один ли это цвет.`);
  if (p.colorMatch === 'abbr') p.notes.push(`Образец сопоставлен с картой по сокращённому названию: «${p.colorName}» → «${p.cardName}».`);
  if (!p.colorId) p.notes.push('Образец цвета на карте расцветок не найден — оттенок уточняйте у менеджера.');
}
// Обратные ссылки: какие названия со склада относятся к цвету карты
for (const c of colors) c.inStockAs = [...new Set(products.filter((p) => p.colorId === c.id).map((p) => p.colorName))];
const codeDupes = {};
for (const c of colors) (codeDupes[c.code] ||= []).push(c.name);
for (const c of colors) if (codeDupes[c.code].length > 1) c.note = `На карте этот артикул (${c.code}) указан также у: ${codeDupes[c.code].filter((n) => n !== c.name).join(', ')}.`;

const meta = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: path.basename(SRC),
  stockDate,
  stockTitle,
  cardTitle: String(sheets[SHEET.card].A1 || '').trim(),
  assorti,
  counts: { colors: colors.length, products: products.length, stockNames: stockNames.length, matched: products.filter((p) => p.colorId).length },
  unmatchedStockNames: [...new Set(products.filter((p) => !p.colorId).map((p) => p.colorName))],
};
fs.writeFileSync(path.join(OUT_DATA, 'colors.json'), JSON.stringify(colors, null, 1));
fs.writeFileSync(path.join(OUT_DATA, 'products.json'), JSON.stringify(products, null, 1));
fs.writeFileSync(path.join(OUT_DATA, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(`Цветов на карте: ${colors.length}; позиций: ${products.length}; с образцом: ${meta.counts.matched}; дата остатков: ${stockDate}`);
