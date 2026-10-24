/*
 * После `vite build`: для каждого маршрута пишет dist/<путь>/index.html со своими title,
 * description, canonical и Open Graph. Так прямые ссылки работают на GitHub Pages
 * (статический хостинг без серверной маршрутизации), а поисковики видят мета-теги без JS.
 * Также создаёт 404.html (неизвестные адреса открывают приложение со страницей «не найдено»),
 * sitemap.xml и robots.txt.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const siteSrc = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8');
const NAME = siteSrc.match(/name:\s*'([^']+)'/)[1];
const URL_ = siteSrc.match(/url:\s*'([^']+)'/)[1].replace(/\/?$/, '/');
const products = JSON.parse(readFileSync(join(ROOT, 'src/data/generated/products.json'), 'utf8'));
const colors = JSON.parse(readFileSync(join(ROOT, 'src/data/generated/colors.json'), 'utf8'));
const shell = readFileSync(join(DIST, 'index.html'), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Те же правила, что в src/data/catalog.ts
const material = (p) => (p.categories.includes('half-wool') ? 'Полушерсть' : p.categories.includes('acrylic') ? 'Акрил' : 'Пряжа');
const title = (p) => `${material(p)} «${cap(p.colorName.trim())}»${p.tex ? `, ${p.tex} текс` : ''}`;
const sub = (p) => p.composition ?? 'Состав уточняется';

const pages = [
  { path: '', title: `${NAME} — бобинная пряжа оптом: полушерсть и акрил, ${colors.length} оттенков`, desc: `«${NAME}»: бобинная пряжа для машинного вязания и трикотажа — полушерсть и акрил, ${colors.length} оттенков по карте расцветок, состав и остатки по каждой позиции. Подбор по цвету, заявка и КП.` },
  { path: 'catalog', title: 'Каталог бобинной пряжи', desc: `Каталог бобинной пряжи: ${products.length} позиций с образцами цвета, составом и остатками. Фильтры по оттенку, составу и толщине, заявка на опт.` },
  { path: 'colors', title: 'Подбор пряжи по цвету — палитра оттенков', desc: `Палитра из ${colors.length} оттенков бобинной пряжи по карте расцветок: цвет, название и артикул. Выберите цвета, сравните и добавьте позиции в заявку.` },
  { path: 'about', title: 'О производстве: переработка шерсти дагестанского мериноса', desc: 'Производство мытой шерсти, топса и шерстяной пряжи в Республике Дагестан: сортировка, мойка, гребнечесание, прядение, контроль и отгрузка. Сырьё — шерсть дагестанского мериноса.' },
  { path: 'delivery', title: 'Оплата и доставка пряжи', desc: 'Как заказать бобинную пряжу: заявка, КП и счёт на email, безналичная оплата, отгрузка по всей России — ТК, автотранспорт, железная дорога.' },
  { path: 'wholesale', title: 'Оптовым покупателям — прайс на бобинную пряжу', desc: `Оптовые поставки бобинной пряжи: ${colors.length} оттенков, полушерсть и акрил. Запросите прайс и расчёт под ваш объём.` },
  { path: 'contacts', title: 'Контакты', desc: `Контакты: ${NAME}. Вопросы по пряже, образцам и оптовым заказам.` },
  { path: 'privacy', title: 'Политика конфиденциальности', desc: `Как сайт «${NAME}» обрабатывает персональные данные из заявок.` },
  { path: 'favorites', title: 'Избранное', desc: 'Сохранённые позиции бобинной пряжи.', noindex: true },
  { path: 'request', title: 'Заявка на пряжу', desc: 'Список выбранной бобинной пряжи: укажите объём и отправьте заявку на расчёт.', noindex: true },
  ...products.map((p) => ({
    path: `product/${p.id}`,
    title: `${title(p)} — ${sub(p)}`,
    desc: `${title(p)}: ${sub(p)}${p.tex ? `, ${p.tex} текс` : ''}. Пряжа на бобинах${p.purpose.includes('machine') ? ' для машинного вязания' : ''}, образец цвета, остаток по данным склада. Цена по запросу.`,
  })),
];

function render({ path, title: t, desc, noindex }) {
  const full = t.includes(NAME) ? t : `${t} — ${NAME}`;
  const url = URL_ + (path ? `${path}/` : '');
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(full)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta name="robots" content=")[^"]*/, `$1${noindex ? 'noindex' : 'index, follow'}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(full)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`);
}

for (const p of pages) {
  const dir = join(DIST, p.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), render(p));
}
writeFileSync(join(DIST, '404.html'), render({ path: '', title: 'Страница не найдена', desc: 'Такой страницы нет.', noindex: true }));

const today = new Date().toISOString().slice(0, 10);
const indexed = pages.filter((p) => !p.noindex);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map((p) => `  <url><loc>${URL_}${p.path ? `${p.path}/` : ''}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nDisallow: ${new URL(URL_).pathname}request/\nDisallow: ${new URL(URL_).pathname}favorites/\n\nSitemap: ${URL_}sitemap.xml\n`);
console.log(`prerender: ${pages.length} страниц, sitemap: ${indexed.length} адресов`);
