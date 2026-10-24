import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, ClipboardList, Layers, Palette, Ruler } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard, asset } from '../components/ProductCard';
import { Faq } from '../components/Faq';
import { COLORS, META, PRODUCTS, formatDate, hueOf, labels } from '../data/catalog';
import { COLOR_GROUPS } from '../data/taxonomy';
import { IMAGES } from '../data/images';
import { site } from '../config/site';
import { FAQ_ITEMS } from './faqItems';

const byCat = (id: string) => PRODUCTS.filter((p) => p.categories.includes(id));
const swatchesOf = (list: typeof PRODUCTS, n = 4) => [...new Set(list.map((p) => p.colorId).filter(Boolean))].slice(0, n).map((id) => COLORS.find((c) => c.id === id)!);

export function HomePage() {
  const half = byCat('half-wool'), acr = byCat('acrylic');
  const melange = PRODUCTS.filter((p) => p.yarnType === 'melange' || p.groups.includes('melange'));
  const multi = PRODUCTS.filter((p) => p.groups.includes('multi'));
  const top = [...PRODUCTS].sort((a, b) => b.stock.kg - a.stock.kg).slice(0, 8);
  const strip = [...COLORS].sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
  const groupsWithItems = COLOR_GROUPS.filter((g) => COLORS.some((c) => c.groups.includes(g.id)));
  const cats = [
    { to: '/catalog?composition=half-wool', title: 'Полушерсть', sub: 'Шерсть 30%, ПАН 70%', list: half },
    { to: '/catalog?composition=acrylic', title: 'Акриловая пряжа', sub: 'ПАН 100%', list: acr },
    { to: '/catalog?type=melange', title: 'Меланжевая пряжа', sub: 'Нить с вкраплениями оттенков', list: melange },
    { to: '/catalog?group=multi', title: 'Ассорти и многоцветные', sub: 'Смешанные расцветки', list: multi },
  ].filter((c) => c.list.length);

  return (
    <>
      <Seo title={`${site.name} — каталог пряжи на бобинах для машинного вязания`}
        description={`Бобинная пряжа: полушерсть и акрил, ${COLORS.length} оттенков по карте расцветок с образцами, состав и остатки по каждой позиции. Подбор по цвету, заявка на опт.`} />

      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-bg" src={IMAGES.hero.src} srcSet={`${IMAGES.hero.srcSmall} 800w, ${IMAGES.hero.src} 1600w`} sizes="100vw" width={1600} height={1000} alt={IMAGES.hero.alt} fetchPriority="high" />
        <div className="container hero-inner">
          <p className="eyebrow">Пряжа на бобинах · {COLORS.length} оттенков</p>
          <h1 id="hero-title">Бобинная пряжа для ваших идей и производства</h1>
          <p className="hero-lead">Подберите цвет, состав и толщину нити для вязания, трикотажа и текстильного производства.</p>
          <div className="hero-actions">
            <Link className="btn btn-light" to="/catalog">Смотреть каталог</Link>
            <Link className="btn btn-outline" to="/colors"><Palette aria-hidden="true" />Подобрать пряжу</Link>
            <Link className="btn btn-outline" to="/wholesale">Запросить оптовый прайс</Link>
          </div>
          <dl className="hero-facts">
            <div><dt>Оттенков на карте</dt><dd className="num">{COLORS.length}</dd></div>
            <div><dt>Позиций в каталоге</dt><dd className="num">{PRODUCTS.length}</dd></div>
            <div><dt>Составы</dt><dd>полушерсть, акрил</dd></div>
            <div><dt>Остатки</dt><dd>на {formatDate(META.stockDate)}</dd></div>
          </dl>
        </div>
        <p className="hero-credit">{IMAGES.hero.credit} · иллюстрация</p>
      </section>

      <div className="swatch-strip" aria-label="Палитра: все оттенки карты расцветок">
        {strip.map((c) => <Link key={c.id} to={`/colors?pick=${c.id}`} title={`${c.name} · ${c.code}`} style={{ background: c.hex }}><span className="sr-only">{c.name}</span></Link>)}
      </div>

      <section className="section" aria-labelledby="adv-title">
        <div className="container">
          <div className="section-head"><p className="eyebrow">Почему удобно</p><h2 id="adv-title">Подбор пряжи без лишних звонков</h2></div>
          <ul className="adv">
            <li><Palette aria-hidden="true" /><b>{COLORS.length} оттенков с образцами</b><span>У каждого — название, артикул и фото мотка с карты расцветок.</span></li>
            <li><Layers aria-hidden="true" /><b>Подбор по составу</b><span>Полушерсть (шерсть 30%, ПАН 70%) и акрил (ПАН 100%) — фильтр в один клик.</span></li>
            <li><Ruler aria-hidden="true" /><b>Толщина и назначение</b><span>Линейная плотность в тексах и номер Nm — там, где они известны.</span></li>
            <li><Boxes aria-hidden="true" /><b>Остатки по каждому цвету</b><span>Масса на складе по данным таблицы — с датой, чтобы было ясно, что уточнить.</span></li>
            <li><ClipboardList aria-hidden="true" /><b>Одна заявка на много цветов</b><span>Соберите позиции в список, укажите объём — и отправьте одним запросом.</span></li>
          </ul>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="cats-title">
        <div className="container">
          <div className="head-row">
            <div className="section-head"><p className="eyebrow">Каталог</p><h2 id="cats-title">Основные категории</h2></div>
            <Link className="btn btn-ghost" to="/catalog">Весь каталог<ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="grid-4">
            {cats.map((c) => (
              <Link key={c.to} to={c.to} className="cat-card">
                <span className="cat-mosaic">{swatchesOf(c.list).map((s) => <img key={s.id} src={asset(s.swatch)} width={220} height={99} alt="" loading="lazy" decoding="async" />)}</span>
                <span className="cat-body"><b>{c.title}</b><small>{c.sub}</small><span className="cat-count">{c.list.length} позиций →</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="pal-title">
        <div className="container">
          <div className="head-row">
            <div className="section-head"><p className="eyebrow">Палитра</p><h2 id="pal-title">Оттенки по группам</h2><p>Нажмите на группу — откроется подборка товаров этих оттенков.</p></div>
            <Link className="btn btn-primary" to="/colors"><Palette aria-hidden="true" />Открыть подбор по цвету</Link>
          </div>
          <ul className="group-grid">
            {groupsWithItems.map((g) => {
              const cs = COLORS.filter((c) => c.groups.includes(g.id));
              return (
                <li key={g.id}>
                  <Link to={`/catalog?group=${g.id}`} className="group-card">
                    <span className="group-chips" aria-hidden="true">{cs.slice(0, 6).map((c) => <i key={c.id} style={{ background: c.hex }} />)}</span>
                    <b>{labels.group(g.id)}</b><small>{cs.length} оттенков</small>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="top-title">
        <div className="container">
          <div className="head-row">
            <div className="section-head"><p className="eyebrow">Популярные позиции</p><h2 id="top-title">Больше всего на складе</h2><p>По данным таблицы остатков на {formatDate(META.stockDate)}. Наличие перед заказом уточняйте у менеджера.</p></div>
            <Link className="btn btn-ghost" to="/catalog?sort=stock">Все по остатку<ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="product-grid">{top.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
        </div>
      </section>

      <section className="section" aria-labelledby="guide-title">
        <div className="container guide">
          <div>
            <div className="section-head"><p className="eyebrow">Как выбрать</p><h2 id="guide-title">Как подобрать бобинную пряжу</h2>
              <p>Общие рекомендации — не характеристики конкретного товара. Параметры позиции смотрите в её карточке.</p></div>
            <dl className="guide-list">
              <div><dt>Состав</dt><dd>Шерсть в составе даёт тепло и упругость, акрил (ПАН) — лёгкость, яркость цвета и простой уход. Полушерсть сочетает оба свойства.</dd></div>
              <div><dt>Толщина</dt><dd>Линейная плотность в тексах — масса 1000 м нити в граммах: чем больше текс, тем толще нить. Метрический номер Nm обратен: Nm = 1000 / текс.</dd></div>
              <div><dt>Крутка и сложения</dt><dd>Число сложений и крутка влияют на прочность, рельеф петли и поведение нити на машине.</dd></div>
              <div><dt>Назначение и оборудование</dt><dd>Под класс вязальной машины нужна нить подходящей толщины. Если сомневаетесь — запросите образец и проверьте на своём оборудовании.</dd></div>
            </dl>
          </div>
          <figure className="guide-photo">
            <img src={IMAGES.guide.srcSmall} width={800} height={600} alt={IMAGES.guide.alt} loading="lazy" decoding="async" />
            <figcaption>{IMAGES.guide.credit} · иллюстрация</figcaption>
          </figure>
        </div>
      </section>

      <section className="section section-dark wholesale-band" aria-labelledby="ws-title">
        <div className="container ws-inner">
          <div>
            <p className="eyebrow">Оптовым покупателям</p>
            <h2 id="ws-title">Фабрикам, мастерским и крупным заказчикам</h2>
            <p>Соберите список цветов и объёмов — пришлём расчёт и условия поставки. Цены формируются по запросу.</p>
          </div>
          <div className="ws-actions">
            <Link className="btn btn-light" to="/wholesale">Запросить оптовый прайс</Link>
            <Link className="btn btn-outline" to="/colors">Подобрать цвета</Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title">
        <div className="container faq-layout">
          <div className="section-head"><p className="eyebrow">Вопросы и ответы</p><h2 id="faq-title">Частые вопросы</h2>
            <p>Не нашли ответ — задайте вопрос в заявке.</p>
            <div><Link className="btn btn-primary" to="/request">Отправить заявку</Link></div></div>
          <Faq items={FAQ_ITEMS} />
        </div>
      </section>
    </>
  );
}
