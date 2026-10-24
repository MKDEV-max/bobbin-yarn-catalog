/* «Оплата и доставка» — структура и тексты со страницы delivery.html сайта компании. */
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { site } from '../config/site';
import { PageHead } from './PageHead';

/** Условия работы из site.terms — пустые пункты не показываются */
export function Terms() {
  const t = site.terms;
  const rows = [
    ['Минимальная партия', t.minOrder], ['Образцы', t.samples], ['География', t.geography],
    ['Оплата', t.payment], ['Доставка', t.delivery], ['Упаковка', t.packaging],
    ['Срок изготовления', t.productionTime], ['Срок отгрузки', t.shipTime], ['Документы', t.documents],
  ].filter(([, v]) => v);
  return <dl className="terms">{rows.map(([k, v]) => <div className="term" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

export function DeliveryPage() {
  return (
    <>
      <Seo title="Оплата и доставка пряжи" description="Как заказать бобинную пряжу: заявка, КП и счёт на email, безналичная оплата, отгрузка по всей России — ТК, автотранспорт, железная дорога." />
      <PageHead title="Оплата и доставка" lead="Работаем с компаниями и ИП по заявке: рассчитываем стоимость под объём, выставляем счёт и отгружаем партию по всей России." />

      <section className="section" aria-labelledby="process-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Порядок работы</p>
            <h2 id="process-title">Как проходит заказ</h2>
            <p>Онлайн-оплаты на сайте нет: цену рассчитываем индивидуально — она зависит от позиции, объёма и требований к партии.</p>
          </div>
          <ol className="steps">
            <li><b>Заявка</b><p>Через форму на сайте: позиция, объём партии, для пряжи — номер нити.</p></li>
            <li><b>КП и счёт на email</b><p>Менеджер рассчитывает стоимость и присылает коммерческое предложение и счёт.</p></li>
            <li><b>Оплата</b><p>Безналичный расчёт по счёту или по договору поставки.</p></li>
            <li><b>Отгрузка</b><p>Со склада производства в Дагестане — удобным для вас способом.</p></li>
          </ol>
          <div className="section-foot"><Link className="btn btn-primary" to="/request">Перейти к заявке</Link></div>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="terms-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Условия</p>
            <h2 id="terms-title">Оплата, доставка, упаковка</h2>
          </div>
          <Terms />
        </div>
      </section>

      <section className="section" aria-labelledby="ship-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Доставка</p>
            <h2 id="ship-title">Способы отгрузки</h2>
          </div>
          <div className="grid-4">
            <article className="client-card"><h3>Самовывоз</h3><p>Со склада производства в Республике Дагестан, в согласованное время.</p></article>
            <article className="client-card"><h3>Транспортные компании</h3><p>Отправка через транспортную компанию по вашему выбору — до терминала или до двери.</p></article>
            <article className="client-card"><h3>Автотранспорт</h3><p>Для партий, которые удобнее везти отдельной машиной.</p></article>
            <article className="client-card"><h3>Железная дорога</h3><p>Для крупных партий — до вагонных норм.</p></article>
          </div>
          <p className="muted" style={{ marginTop: 'var(--space-5)', maxWidth: '64ch' }}>Стоимость доставки рассчитывается по тарифу перевозчика и указывается в КП или оплачивается при получении — по договорённости.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Запрос предложения">
        <div className="container">
          <div className="cta-band on-dark">
            <div>
              <h2>Рассчитаем партию с доставкой</h2>
              <p>Укажите позицию, объём и город доставки — пришлём КП.</p>
            </div>
            <div className="actions">
              <Link className="btn btn-sand" to="/wholesale">Получить КП</Link>
              <Link className="btn btn-outline" to="/catalog">Смотреть каталог</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
