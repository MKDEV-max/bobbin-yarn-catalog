import { Link } from 'react-router-dom';
import { ArrowRight, Palette } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { ColorChip } from '../components/ColorSwatch';
import { Faq } from '../components/Faq';
import { Ridge } from '../components/Brand';
import { CATALOG, COLORS, hueOf, labels } from '../data/catalog';
import { COMPOSITION_OPTIONS } from '../data/variants';
import { COLOR_GROUPS } from '../data/taxonomy';
import { IMAGES } from '../data/images';
import { site } from '../config/site';
import { FAQ_ITEMS } from './faqItems';
import { Terms } from './DeliveryPage';

/** Порядок облака оттенков: тон (12 секторов), внутри — от светлого к тёмному; серые и чёрные — в конце */
const cloudKey = (hex: string) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), l = (Math.max(...v) + Math.min(...v)) / 2;
  const h = hueOf(hex);
  return (h >= 400 ? 13 : Math.floor(((h + 15) % 360) / 30)) * 10 + (1 - l) * 9;
};
const capFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const satOf = (hex: string) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); const mx = Math.max(...v), mn = Math.min(...v); return mx ? (mx - mn) / mx : 0; };
/** Насыщенные цвета каталога — для мозаик карточек составов (каждая карточка — своя восьмёрка) */
const VIVID = CATALOG.filter((c) => c.hex).sort((a, b) => satOf(b.hex!) - satOf(a.hex!));
const mosaic = (i: number) => VIVID.slice(i * 8, i * 8 + 8).sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
const COMP_TEXT: Record<string, string> = {
  w30: 'Тепло шерсти и прочность ПАН — универсальный вариант для трикотажа.',
  w50: 'Больше шерсти: мягкость и упругость петли.',
  pan100: 'Яркие стойкие цвета и простой уход.',
  custom: 'Свои проценты шерсти и ПАН — укажите прямо в карточке цвета.',
};

export function HomePage() {
  // Яркие цвета: самые насыщенные цвета каталога — по одному на группу цвета
  const seenGroup = new Set<string>();
  const top = VIVID.filter((c) => { const g = c.group ?? ''; if (seenGroup.has(g)) return false; seenGroup.add(g); return true; }).slice(0, 8);
  const strip = [...COLORS].sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
  const cloud = [...COLORS].sort((a, b) => cloudKey(a.hex) - cloudKey(b.hex));
  const groupsWithItems = COLOR_GROUPS.filter((g) => COLORS.some((c) => c.groups.includes(g.id)));

  return (
    <>
      <Seo title={`${site.name} — бобинная пряжа оптом: ${CATALOG.length} цветов, скрутка 16/2 и 32/2`}
        description={`«${site.name}»: бобинная пряжа для машинного вязания и трикотажа — ${CATALOG.length} цветов, скрутка 16/2 и 32/2, составы 30/70, 50/50, 100% ПАН или индивидуальный. Подбор по цвету, заявка и КП.`} />

      <section className="hero on-dark" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">{site.name} · {site.region}</p>
            <h1 id="hero-title">Бобинная пряжа для ваших идей и производства</h1>
            <p className="hero-lead">Выберите цвет, скрутку 16/2 или 32/2 и состав — от 100% ПАН до вашего соотношения шерсти и ПАН. {CATALOG.length} цветов, поставки по всей России.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/catalog">Смотреть каталог</Link>
              <Link className="btn btn-outline" to="/colors">Подобрать пряжу</Link>
              <Link className="link-arrow" to="/wholesale">Запросить оптовый прайс</Link>
            </div>
            <dl className="hero-facts">
              <div><dt>Цветов в каталоге</dt><dd>{CATALOG.length}</dd></div>
              <div><dt>Скрутка</dt><dd>16/2 и 32/2</dd></div>
              <div><dt>Составы</dt><dd>30/70, 50/50, 100% ПАН, свой</dd></div>
              <div><dt>Оплата</dt><dd>по счёту, безнал</dd></div>
            </dl>
          </div>
          <div className="hero-media">
            <Link className="hero-tile" to="/catalog">
              <img src={IMAGES.hero.srcSmall} width={800} height={600} alt={IMAGES.hero.alt} fetchPriority="high" decoding="async" />
              <span>Пряжа на бобинах</span>
            </Link>
            <Link className="hero-tile" to="/catalog?comp=w30">
              <img src={IMAGES.guide.srcSmall} width={800} height={600} alt={IMAGES.guide.alt} decoding="async" />
              <span>30% шерсть / 70% ПАН</span>
            </Link>
            <Link className="hero-tile" to="/catalog?comp=pan100">
              <img src={IMAGES.wholesale.srcSmall} width={800} height={500} alt={IMAGES.wholesale.alt} decoding="async" />
              <span>100% ПАН</span>
            </Link>
            <p className="hero-media-note">Фото — иллюстрации продукции (Unsplash)</p>
          </div>
        </div>
        <Ridge />
      </section>

      {/* Лента из всех цветов карты расцветок — нить, которая проходит через сайт */}
      <div className="yarn-ribbon" aria-label="Все оттенки карты расцветок">
        {strip.map((c) => <Link key={c.id} to={`/colors?pick=${c.id}`} title={`${c.name} · ${c.code}`} style={{ backgroundColor: c.hex }}><span className="sr-only">{c.name}</span></Link>)}
      </div>

      <section className="section" aria-labelledby="products-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Продукция</p>
            <h2 id="products-title">Четыре состава для любого цвета</h2>
            <p>Каждый цвет каталога — в скрутке 16/2 или 32/2 и в одном из четырёх составов. Цену и наличие конкретного сочетания подтверждает менеджер по заявке.</p>
          </div>
          <div className="grid-4">
            {COMPOSITION_OPTIONS.map((o, i) => (
              <Link key={o.id} to={`/catalog?comp=${o.id}`} className="cat-card">
                <span className="media cat-mosaic" aria-hidden="true">{mosaic(i).map((c) => <ColorChip key={c.id} hex={c.hex} size="fill" />)}</span>
                <span className="body"><h3>{o.label}</h3><p>{o.note ? `${capFirst(o.note)}. ` : ''}{COMP_TEXT[o.id]}</p><span className="more">Скрутка 16/2 и 32/2 →</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-color on-dark" aria-labelledby="pal-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Палитра</p>
            <h2 id="pal-title">{COLORS.length} оттенков по карте расцветок</h2>
            <p>Цвета из файла карты расцветок — однотонными образцами. Нажмите на группу, чтобы открыть подборку пряжи этих оттенков.</p>
          </div>
          <div className="palette-cloud" aria-label="Все оттенки карты расцветок">
            {cloud.map((c) => <Link key={c.id} to={`/colors?pick=${c.id}`} title={`${c.name} · ${c.code}`} style={{ backgroundColor: c.hex }}><span className="sr-only">{c.name}, {c.code}</span></Link>)}
          </div>
          <ul className="group-grid">
            {groupsWithItems.map((g) => {
              const cs = COLORS.filter((c) => c.groups.includes(g.id));
              return (
                <li key={g.id}>
                  <Link to={`/catalog?group=${g.id}`} className="group-card">
                    <span className="group-chips" aria-hidden="true">{cs.slice(0, 5).map((c) => <ColorChip key={c.id} hex={c.hex} size="dot" />)}</span>
                    <b>{labels.group(g.id)}</b><small>{cs.length} оттенков</small>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="section-foot"><Link className="btn btn-primary" to="/colors"><Palette aria-hidden="true" />Подбор по цвету</Link></div>
        </div>
      </section>

      <section className="section" aria-labelledby="top-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Яркие цвета</p>
            <h2 id="top-title">Насыщенные цвета каталога</h2>
            <p>По одному цвету из разных групп. Выберите скрутку и состав прямо в карточке — и добавьте в заявку.</p>
          </div>
          <div className="product-grid">{top.map((c, i) => <ProductCard key={c.id} c={c} index={i} />)}</div>
          <div className="section-foot"><Link className="btn btn-primary" to="/catalog">Смотреть каталог</Link></div>
        </div>
      </section>

      <section className="section section-warm" aria-labelledby="who-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">О компании</p>
            <h2 id="who-title">Производитель, а не посредник</h2>
            <p>«{site.name}» перерабатывает шерсть и поставляет её напрямую производствам — без перекупщиков. Производство — {site.region}: сортировка, мойка, гребнечесание, прядение, контроль и отгрузка.</p>
          </div>
          <div className="facts">
            <div className="fact"><b>Свой цикл переработки</b><span>От сортировки руна до пряжи на бобинах и в пасмах.</span></div>
            <div className="fact"><b>Образцы до заказа</b><span>Проверьте пряжу на своём оборудовании до заказа партии.</span></div>
            <div className="fact"><b>От мешка до вагона</b><span>Отгрузка по всей России: ТК, автотранспорт, железная дорога.</span></div>
          </div>
          <div className="section-foot"><Link className="link-arrow" to="/about">Как устроено производство</Link></div>
        </div>
      </section>

      <section className="section" aria-labelledby="guide-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Как выбрать</p>
            <h2 id="guide-title">Как подобрать бобинную пряжу</h2>
            <p>Общие рекомендации — не характеристики конкретного товара. Параметры позиции смотрите в её карточке.</p>
          </div>
          <div className="facts facts-4">
            <div className="fact"><b>Состав</b><span>Шерсть даёт тепло и упругость, акрил (ПАН) — лёгкость, яркость цвета и простой уход. Полушерсть сочетает оба свойства.</span></div>
            <div className="fact"><b>Толщина</b><span>Текс — масса 1000 м нити в граммах: чем больше текс, тем толще нить. Номер Nm обратен: Nm = 1000 / текс.</span></div>
            <div className="fact"><b>Крутка и сложения</b><span>Влияют на прочность, рельеф петли и поведение нити на машине.</span></div>
            <div className="fact"><b>Оборудование</b><span>Под класс машины нужна нить подходящей толщины. Сомневаетесь — запросите образец.</span></div>
          </div>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="order-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Как заказать</p>
            <h2 id="order-title">От заявки до отгрузки — четыре шага</h2>
          </div>
          <ol className="steps">
            <li><b>Заявка</b><p>Позиции, цвета и объём партии. Можно сразу запросить образец.</p></li>
            <li><b>КП и счёт</b><p>Менеджер рассчитывает стоимость под ваш объём и присылает КП и счёт на email.</p></li>
            <li><b>Оплата</b><p>Безналичный расчёт по счёту или договору поставки.</p></li>
            <li><b>Отгрузка</b><p>Самовывоз, транспортные компании, автотранспорт; крупные партии — по железной дороге.</p></li>
          </ol>
          <div className="section-foot">
            <Link className="btn btn-primary" to="/request">Отправить заявку</Link>
            <Link className="btn btn-outline" to="/wholesale">Получить КП<ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="terms-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Условия</p>
            <h2 id="terms-title">Условия поставки</h2>
          </div>
          <Terms />
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="faq-title">
        <div className="container faq-layout">
          <div className="section-head">
            <p className="eyebrow">Вопросы и ответы</p>
            <h2 id="faq-title">Частые вопросы закупщиков</h2>
            <p>Не нашли ответ — задайте вопрос в заявке, менеджер ответит вместе с КП.</p>
            <div><Link className="btn btn-primary" to="/request">Отправить заявку</Link></div>
          </div>
          <Faq items={FAQ_ITEMS} />
        </div>
      </section>

      <section className="section" aria-label="Запрос предложения">
        <div className="container">
          <div className="cta-band cta-warm on-dark">
            <div>
              <h2>Подберём пряжу под вашу задачу</h2>
              <p>Опишите изделие и оборудование — предложим позицию, пришлём образец и КП.</p>
            </div>
            <div className="actions">
              <Link className="btn btn-primary" to="/wholesale">Получить КП</Link>
              <Link className="btn btn-outline" to="/request">Запросить образец</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
