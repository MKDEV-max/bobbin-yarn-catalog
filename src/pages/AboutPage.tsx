import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { site } from '../config/site';
import { COLORS, META, PRODUCTS, formatDate } from '../data/catalog';
import { IMAGES } from '../data/images';
import { PageHead } from './PageHead';

export function AboutPage() {
  const comps = new Set(PRODUCTS.map((p) => p.composition).filter(Boolean)).size;
  return (
    <>
      <Seo title="О компании" description={`${site.name}: каталог бобинной пряжи с палитрой из ${COLORS.length} оттенков, составом и остатками по каждой позиции.`} />
      <PageHead title="О компании" lead={site.tagline} />
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container about">
          <div className="prose">
            {site.about.map((t) => <p key={t}>{t}</p>)}
            <h2>Что есть в каталоге</h2>
            <ul>
              <li>{COLORS.length} оттенков с карты расцветок — с фото мотка, названием и артикулом;</li>
              <li>{PRODUCTS.length} позиций в {comps} составах — по таблице остатков склада на {formatDate(META.stockDate)};</li>
              <li>фильтры по цвету, составу и толщине, подбор по палитре и заявка сразу на несколько цветов.</li>
            </ul>
            <h2>Как мы работаем с информацией</h2>
            <p>Мы показываем только то, что есть в исходных данных. Если характеристика неизвестна — например, масса одной бобины или цена, — на сайте так и написано: «уточняется» или «по запросу». Цвета на экране приблизительные, поэтому для точного подбора лучше запросить образец.</p>
            <div className="actions"><Link className="btn btn-primary" to="/catalog">Перейти в каталог</Link><Link className="btn btn-outline" to="/contacts">Контакты</Link></div>
          </div>
          <figure className="about-photo">
            <img src={IMAGES.wholesale.srcSmall} width={800} height={500} alt={IMAGES.wholesale.alt} loading="lazy" decoding="async" />
            <figcaption>{IMAGES.wholesale.credit} · иллюстрация</figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
