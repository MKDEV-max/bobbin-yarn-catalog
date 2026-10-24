import { Link } from 'react-router-dom';
import { ClipboardList, MessageSquareText, PackageCheck, Palette } from 'lucide-react';
import { Seo } from '../components/Seo';
import { site } from '../config/site';
import { PageHead } from './PageHead';

export function DeliveryPage() {
  const d = site.delivery;
  const known = d.payment.length || d.shipping.length || d.pickup;
  return (
    <>
      <Seo title="Доставка и оплата" description="Как заказать бобинную пряжу: заявка, расчёт, подтверждение наличия, оплата и доставка." />
      <PageHead title="Доставка и оплата" lead="Заказ оформляется по заявке: менеджер подтверждает наличие, цену и условия поставки." />
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          <h2 className="h-small">Как проходит заказ</h2>
          <ol className="steps">
            <li><Palette aria-hidden="true" /><b>Выберите пряжу</b><span>В каталоге или на палитре — по цвету, составу, толщине.</span></li>
            <li><ClipboardList aria-hidden="true" /><b>Соберите заявку</b><span>Укажите объём в килограммах или бобинах по каждой позиции.</span></li>
            <li><MessageSquareText aria-hidden="true" /><b>Получите расчёт</b><span>Менеджер подтвердит наличие, цену, массу бобин и сроки.</span></li>
            <li><PackageCheck aria-hidden="true" /><b>Оплата и отгрузка</b><span>По согласованным условиям — после подтверждения заказа.</span></li>
          </ol>

          <div className="grid-2 info-cards">
            <div className="card">
              <h2 className="h-small">Оплата</h2>
              {d.payment.length ? <ul className="bullets">{d.payment.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Способы оплаты сообщит менеджер при подтверждении заказа.</p>}
            </div>
            <div className="card">
              <h2 className="h-small">Доставка</h2>
              {d.shipping.length ? <ul className="bullets">{d.shipping.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Способ и стоимость доставки рассчитываются под объём и город — уточните в заявке.</p>}
              {d.pickup && <p style={{ marginTop: 'var(--space-3)' }}>{d.pickup}</p>}
            </div>
          </div>
          {!known && <p className="hint" style={{ marginTop: 'var(--space-4)' }}>Условия оплаты и доставки ещё не опубликованы на сайте, поэтому их называет менеджер в ответ на заявку.</p>}
          <div className="actions" style={{ marginTop: 'var(--space-6)' }}><Link className="btn btn-primary" to="/request">Перейти к заявке</Link><Link className="btn btn-outline" to="/wholesale">Оптовым покупателям</Link></div>
        </div>
      </section>
    </>
  );
}
