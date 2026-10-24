# Бобинная пряжа — каталог

Сайт-каталог пряжи на бобинах: палитра по карте расцветок, фильтры, подбор по цвету, избранное и заявка на опт.
React + TypeScript + Vite + lucide-react. Публикуется на GitHub Pages.

Сайт: https://mkdev-max.github.io/bobbin-yarn-catalog/

## Запуск

Нужен Node.js 20.19+ (или 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # сборка в dist/ + страницы для каждого адреса, sitemap.xml, robots.txt, 404.html
npm run preview    # просмотр собранной версии
```

## Откуда данные

Источник — Excel-файл «карта цветов.xlsx». **В репозиторий он не попадает** (`.gitignore`), исходный файл не изменяется.
Скрипт `scripts/import-xlsx.mjs` читает его и создаёт:

| Файл | Что внутри |
|---|---|
| `src/data/generated/colors.json` | 229 оттенков карты расцветок: название и артикул как на карте, приблизительный HEX, тип (однотонный / меланж / мулине), группы цвета |
| `src/data/generated/products.json` | 212 позиций из таблицы остатков: оттенок, состав, текс (если есть), остаток в кг и дата |
| `src/data/generated/meta.json` | дата остатков, расшифровка «Ассорти», нераспознанные названия |
| `public/swatches/*.webp` | вырезки мотков с фото карты расцветок |

Названия оттенков с карты расцветок переписаны вручную в `data-source/color-card.json` (картинки в Excel без текста).
Связь «название в остатках ↔ оттенок на карте» — только точное совпадение или явное сокращение (`ABBR` в скрипте), без угадывания.

Обновить данные после новой выгрузки:

```bash
npm run import-data -- "путь/к/карта цветов.xlsx"   # по умолчанию ../карта цветов.xlsx
```

Затем закоммитьте изменения в `src/data/generated` и `public/swatches` — сайт пересоберётся сам.

## Что настраивается без программиста — `src/config/site.ts`

- `name`, `tagline`, `url` — название (временное) и адрес сайта.
- `contacts` — телефон, email, WhatsApp, Telegram, адрес, часы работы. Пустое поле на сайте не показывается.
- `legal` — реквизиты (ИП/ООО, ИНН, ОГРН). Пока пусто — не показываются; политика конфиденциальности честно пишет, что реквизиты будут опубликованы.
- `form` — отправка заявок. Получите ключ на [web3forms.com](https://web3forms.com) (письма будут приходить на вашу почту) и впишите в `accessKey`. Без ключа сайт **не делает вид**, что заявка отправлена: показывает готовый текст и кнопки «отправить на почту / в мессенджер» из `contacts`.
- `stock.show` — показывать ли остатки; `stock.freshUntil` — с какой даты остатки считать актуальными (иначе статус «Уточнить наличие»).
- `about`, `delivery` — тексты страниц «О компании» и «Доставка и оплата».

Фото первого экрана и иллюстрации — `src/data/images.ts` (сейчас фото Unsplash, не изображают конкретные товары).
Цвета интерфейса — `src/styles/colors.css` (взяты с карты расцветок).

## Чего нет в данных (не выдумано, на сайте — «уточняется» / «по запросу»)

Цены, масса одной бобины, номер Nm и сложения для большинства позиций, минимальная партия, контакты, реквизиты, условия оплаты и доставки.
Когда появятся — добавьте поля в данные (`products.json` уже содержит `priceRub`, `bobbinWeightKg`, `ply`, `minOrder`), фильтры по ним включатся автоматически.

## Структура

```
src/
  config/site.ts          настройки сайта
  data/                   catalog.ts (единый источник данных, типы), taxonomy.ts (категории), images.ts
  components/             Header, Footer, ProductCard, Bobbin, ColorSwatch, ContactForm, Faq, Seo
  pages/                  Home, Catalog, ColorSelection, Product, About, Delivery, Wholesale, Contacts, Favorites, Request, Privacy, NotFound
  state/store.tsx         избранное и заявка (localStorage)
  lib/submit.ts           отправка заявки, проверка полей
scripts/
  import-xlsx.mjs         Excel → JSON + образцы
  prerender.mjs           HTML для каждого адреса, sitemap, robots, 404
  publish-pages.mjs       публикация dist/ в ветку gh-pages (npm run deploy)
deploy/github-pages.yml   готовый workflow автопубликации через GitHub Actions
```

Позже `src/data/catalog.ts` можно заменить загрузкой из API или базы — типы `Color` и `Product` остаются прежними.

## Публикация

Сайт отдаётся GitHub Pages из ветки `gh-pages`. После изменений:

```bash
git push            # код — в main
npm run deploy      # сборка и публикация собранного сайта в gh-pages
```

**Автопубликация через GitHub Actions** (сайт пересобирается сам при каждом push) уже подготовлена в `deploy/github-pages.yml`.
Чтобы включить: дайте GitHub CLI право workflow (`gh auth refresh -h github.com -s workflow`), перенесите файл в `.github/workflows/deploy.yml`,
сделайте push и в настройках репозитория → Pages выберите Source: GitHub Actions.

Если переименуете репозиторий — поменяйте `url` в `src/config/site.ts` и `base` в `vite.config.ts`.
