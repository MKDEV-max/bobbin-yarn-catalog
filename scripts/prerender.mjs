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
import { buildCatalogColors } from '../src/data/variants.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const siteSrc = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8');
const NAME = siteSrc.match(/name:\s*'([^']+)'/)[1];
const URL_ = siteSrc.match(/url:\s*'([^']+)'/)[1].replace(/\/?$/, '/');
const products = JSON.parse(readFileSync(join(ROOT, 'src/data/generated/products.json'), 'utf8'));
const colors = JSON.parse(readFileSync(join(ROOT, 'src/data/generated/colors.json'), 'utf8'));
const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
// Каталог по цветам — та же функция, что на сайте (src/data/variants.ts)
const includeAll = /includeAllCardColors:\s*true/.test(siteSrc);
const catalog = buildCatalogColors(products, colors, includeAll);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const pages = [
  { path: '', title: `${NAME} — бобинная пряжа оптом: ${catalog.length} цветов, скрутка 16/2 и 32/2`, desc: `«${NAME}»: бобинная пряжа для машинного вязания и трикотажа — ${catalog.length} цветов, скрутка 16/2 и 32/2, составы 30/70, 50/50, 100% ПАН или индивидуальный. Подбор по цвету, заявка и КП.` },
  { path: 'catalog', title: 'Каталог пряжи на бобинах', desc: `Каталог бобинной пряжи «${NAME}»: ${catalog.length} цветов, скрутка 16/2 и 32/2, составы 30/70, 50/50, 100% ПАН и индивидуальный. Фильтры по цвету, скрутке и составу, заявка на опт.` },
  { path: 'colors', title: 'Подбор пряжи по цвету — палитра оттенков', desc: `Палитра из ${colors.length} оттенков бобинной пряжи по карте расцветок: цвет, название и артикул. Выберите цвета, сравните и добавьте позиции в заявку.` },
  { path: 'about', title: 'О производстве: переработка шерсти дагестанского мериноса', desc: 'Производство мытой шерсти, топса и шерстяной пряжи в Республике Дагестан: сортировка, мойка, гребнечесание, прядение, контроль и отгрузка. Сырьё — шерсть дагестанского мериноса.' },
  { path: 'delivery', title: 'Оплата и доставка пряжи', desc: 'Как заказать бобинную пряжу: заявка, КП и счёт на email, безналичная оплата, отгрузка по всей России — ТК, автотранспорт, железная дорога.' },
  { path: 'wholesale', title: 'Оптовым покупателям — прайс на бобинную пряжу', desc: `Оптовые поставки бобинной пряжи: ${catalog.length} цветов, скрутка 16/2 и 32/2, составы от 100% ПАН до индивидуального. Запросите прайс и расчёт под ваш объём.` },
  { path: 'contacts', title: 'Контакты', desc: `Контакты: ${NAME}. Вопросы по пряже, образцам и оптовым заказам.` },
  { path: 'privacy', title: 'Политика конфиденциальности', desc: `Как сайт «${NAME}» обрабатывает персональные данные из заявок.` },
  { path: 'favorites', title: 'Избранное', desc: 'Сохранённые позиции бобинной пряжи.', noindex: true },
  { path: 'request', title: 'Заявка на пряжу', desc: 'Список выбранной бобинной пряжи: укажите объём и отправьте заявку на расчёт.', noindex: true },
  ...catalog.map((c) => {
    const name = cap(c.name.trim());
    return {
      path: `product/${c.id}`,
      title: `Пряжа «${name}»${c.code ? ` ${c.code}` : ''} — скрутка 16/2 и 32/2`,
      desc: `Бобинная пряжа цвета «${name}»${c.code ? `, артикул ${c.code}` : ''}: скрутка 16/2 или 32/2, состав 30% шерсть / 70% ПАН, 50/50, 100% ПАН или индивидуальный. Цена по запросу.`,
    };
  }),
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
