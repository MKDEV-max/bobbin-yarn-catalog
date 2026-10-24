import { Link } from 'react-router-dom';
import { ArrowRight, Palette } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { ColorChip } from '../components/ColorSwatch';
import { Faq } from '../components/Faq';
import { Ridge } from '../components/Brand';
import { COLORS, META, PRODUCTS, formatDate, hueOf, labels } from '../data/catalog';
import { COLOR_GROUPS } from '../data/taxonomy';
import { IMAGES } from '../data/images';
import { site } from '../config/site';
import { FAQ_ITEMS } from './faqItems';
import { Terms } from './DeliveryPage';

const byCat = (id: string) => PRODUCTS.filter((p) => p.categories.includes(id));
const swatchesOf = (list: typeof PRODUCTS, n = 8) => [...new Set(list.map((p) => p.colorId).filter(Boolean))].slice(0, n).map((id) => COLORS.find((c) => c.id === id)!);

export function HomePage() {
  const half = byCat('half-wool'), acr = byCat('acrylic');
  const melange = PRODUCTS.filter((p) => p.yarnType === 'melange' || p.groups.includes('melange'));
  const top = [...PRODUCTS].sort((a, b) => b.stock.kg - a.stock.kg).slice(0, 6);
  const strip = [...COLORS].sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
  const groupsWithItems = COLOR_GROUPS.filter((g) => COLORS.some((c) => c.groups.includes(g.id)));
  const cats = [
    { to: '/catalog?composition=half-wool', title: 'Полушерстяная пряжа', sub: 'Шерсть 30%, ПАН 70% — тепло шерсти и прочность акрила.', list: half },
    { to: '/catalog?composition=acrylic', title: 'Акриловая пряжа', sub: 'ПАН 100% — яркие стойкие цвета и простой уход.', list: acr },
    { to: '/catalog?type=melange', title: 'Меланжевая пряжа', sub: 'Нить с вкраплениями оттенков.', list: melange },
  ].filter((c) => c.list.length);

  return (
    <>
      <Seo title={`${site.name} — бобинная пряжа оптом: полушерсть и акрил, ${COLORS.length} оттенков`}
        description={`«${site.name}»: бобинная пряжа для машинного вязания и трикотажа — полушерсть и акрил, ${COLORS.length} оттенков по карте расцветок, состав и остатки по каждой позиции. Подбор по цвету, заявка и КП.`} />

      <section className="hero on-dark" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">{site.name} · {site.region}</p>
            <h1 id="hero-title">Бобинная пряжа для ваших идей и производства</h1>
            <p className="hero-lead">Подберите цвет, состав и толщину нити для вязания, трикотажа и текстильного производства. {COLORS.length} оттенков по карте расцветок, остатки по каждому цвету, поставки по всей России.</p>
            <div className="hero-actions">
              <Link className="btn btn-sand" to="/catalog">Смотреть каталог</Link>
              <Link className="btn btn-outline" to="/colors">Подобрать пряжу</Link>
              <Link className="link-arrow" to="/wholesale">Запросить оптовый прайс</Link>
            </div>
            <dl className="hero-facts">
              <div><dt>Оттенков на карте</dt><dd>{COLORS.length}</dd></div>
              <div><dt>Позиций в каталоге</dt><dd>{PRODUCTS.length}</dd></div>
              <div><dt>Составы</dt><dd>полушерсть, акрил</dd></div>
              <div><dt>Оплата</dt><dd>по счёту, безнал</dd></div>
            </dl>
          </div>
          <div className="hero-media">
            <Link className="hero-tile" to="/catalog">
              <img src={IMAGES.hero.srcSmall} width={800} height={600} alt={IMAGES.hero.alt} fetchPriority="high" decoding="async" />
              <span>Пряжа на бобинах</span>
            </Link>
            <Link className="hero-tile" to="/catalog?composition=half-wool">
              <img src={IMAGES.guide.srcSmall} width={800} height={600} alt={IMAGES.guide.alt} decoding="async" />
              <span>Полушерсть</span>
            </Link>
            <Link className="hero-tile" to="/catalog?composition=acrylic">
              <img src={IMAGES.wholesale.srcSmall} width={800} height={500} alt={IMAGES.wholesale.alt} decoding="async" />
              <span>Акрил</span>
            </Link>
            <p className="hero-media-note">Фото — иллюстрации продукции (Unsplash)</p>
          </div>
        </div>
        <Ridge />
      </section>

      <section className="section" aria-labelledby="products-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Продукция</p>
            <h2 id="products-title">Бобинная пряжа в каталоге</h2>
            <p>Пряжа для машинного вязания и трикотажа. Состав, толщина и остаток — в карточке каждой позиции; остатки по данным склада на {formatDate(META.stockDate)}, наличие уточняйте у менеджера.</p>
          </div>
          <div className="grid-3">
            {cats.map((c) => (
              <Link key={c.to} to={c.to} className="cat-card">
                <span className="media cat-mosaic" aria-hidden="true">{swatchesOf(c.list).map((s) => <ColorChip key={s.id} hex={s.hex} size="fill" />)}</span>
                <span className="body"><h3>{c.title}</h3><p>{c.sub}</p><span className="more">{c.list.length} позиций →</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="pal-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Палитра</p>
            <h2 id="pal-title">{COLORS.length} оттенков по карте расцветок</h2>
            <p>Цвета из файла карты расцветок — однотонными образцами. Нажмите на группу, чтобы открыть подборку пряжи этих оттенков.</p>
          </div>
          <div className="swatch-strip" aria-label="Все оттенки карты расцветок">
            {strip.map((c) => <Link key={c.id} to={`/colors?pick=${c.id}`} title={`${c.name} · ${c.code}`} style={{ backgroundColor: c.hex }}><span className="sr-only">{c.name}</span></Link>)}
          </div>
          <ul className="group-grid">
            {groupsWithItems.map((g) => {
              const cs = COLORS.filter((c) => c.groups.includes(g.id));
              return (
                <li key={g.id}>
                  <Link to={`/catalog?group=${g.id}`} className="group-card">
                    <span className="group-chips" aria-hidden="true">{cs.slice(0, 6).map((c) => <ColorChip key={c.id} hex={c.hex} size="sm" />)}</span>
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
            <p className="eyebrow">Популярные позиции</p>
            <h2 id="top-title">Больше всего на складе</h2>
            <p>По данным таблицы остатков на {formatDate(META.stockDate)}. Наличие перед заказом уточняйте у менеджера.</p>
          </div>
          <div className="product-grid">{top.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
          <div className="section-foot"><Link className="link-arrow" to="/catalog?sort=stock">Весь каталог по остатку</Link></div>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="who-title">
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
          <div className="cta-band on-dark">
            <div>
              <h2>Подберём пряжу под вашу задачу</h2>
              <p>Опишите изделие и оборудование — предложим позицию, пришлём образец и КП.</p>
            </div>
            <div className="actions">
              <Link className="btn btn-sand" to="/wholesale">Получить КП</Link>
              <Link className="btn btn-outline" to="/request">Запросить образец</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
