import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHead } from './PageHead';
import { Bobbin } from '../components/Bobbin';
import { ContactForm } from '../components/ContactForm';
import { ColorChip } from '../components/ColorSwatch';
import { productById, productSubtitle, productTitle } from '../data/catalog';
import { useStore, type Unit } from '../state/store';

export function RequestPage() {
  const { request, updateItem, removeFromRequest, clearRequest } = useStore();
  const items = request.map((i) => ({ ...i, p: productById.get(i.id)! })).filter((i) => i.p);
  const totalKg = items.filter((i) => i.unit === 'kg').reduce((s, i) => s + (parseFloat(i.qty.replace(',', '.')) || 0), 0);
  const totalBobbins = items.filter((i) => i.unit === 'bobbins').reduce((s, i) => s + (parseInt(i.qty, 10) || 0), 0);

  const body = () => ['Заявка на бобинную пряжу:', ...items.map((i, n) =>
    `${n + 1}. ${productTitle(i.p)} — ${productSubtitle(i.p)}${i.p.cardCode ? `, артикул ${i.p.cardCode}` : ''}; объём: ${i.qty ? `${i.qty} ${i.unit === 'kg' ? 'кг' : 'бобин'}` : 'не указан'}${i.comment ? `; ${i.comment}` : ''}`)].join('\n');

  return (
    <>
      <Seo title="Заявка на пряжу" description="Список выбранной бобинной пряжи: укажите объём по каждой позиции и отправьте заявку на расчёт." noindex />
      <PageHead title="Заявка" crumb="Заявка" lead={<>Укажите объём по каждой позиции и контакты — менеджер ответит с ценой, наличием и условиями.</>} />

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container request-layout">
          <div>
            {items.length ? (
              <>
                <div className="head-row" style={{ marginBottom: 'var(--space-4)' }}>
                  <h2 className="h-small">Позиции: {items.length}</h2>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={clearRequest}>Очистить список</button>
                </div>
                <ul className="req-list">
                  {items.map(({ p, qty, unit, comment }) => {
                    return (
                      <li key={p.id} className="req-item">
                        <div className="req-visual">
                          <Bobbin hex={p.hex} type={p.yarnType} className="req-bobbin" />
                          <ColorChip hex={p.hex} size="md" />
                        </div>
                        <div className="req-main">
                          <Link to={`/product/${p.id}`} className="req-title">{productTitle(p)}</Link>
                          <span className="muted small">{productSubtitle(p)}{p.cardCode ? ` · ${p.cardCode}` : ''}</span>
                          <div className="req-fields">
                            <div className="field">
                              <label htmlFor={`q-${p.id}`}>Объём</label>
                              <div className="qty">
                                <input id={`q-${p.id}`} className="input" inputMode="decimal" placeholder="Например, 50" value={qty} onChange={(e) => updateItem(p.id, { qty: e.target.value.replace(/[^\d.,]/g, '') })} />
                                <select className="select" aria-label="Единица" value={unit} onChange={(e) => updateItem(p.id, { unit: e.target.value as Unit })}>
                                  <option value="kg">кг</option><option value="bobbins">бобин</option>
                                </select>
                              </div>
                            </div>
                            <div className="field">
                              <label htmlFor={`c-${p.id}`}>Комментарий <span className="opt">(необязательно)</span></label>
                              <input id={`c-${p.id}`} className="input" placeholder="Например: нужен образец" value={comment} onChange={(e) => updateItem(p.id, { comment: e.target.value })} />
                            </div>
                          </div>
                        </div>
                        <button className="icon-btn req-remove" type="button" onClick={() => removeFromRequest(p.id)} aria-label={`Удалить: ${productTitle(p)}`}><Trash2 aria-hidden="true" /></button>
                      </li>
                    );
                  })}
                </ul>
                <p className="req-summary">
                  Указано: {totalKg > 0 && <b>{totalKg.toLocaleString('ru-RU')} кг</b>}{totalKg > 0 && totalBobbins > 0 && ' и '}{totalBobbins > 0 && <b>{totalBobbins} бобин</b>}{!totalKg && !totalBobbins && 'объём не указан'}.
                  {' '}Это пожелание по объёму, а не итог заказа: цену и наличие подтвердит менеджер.
                </p>
              </>
            ) : (
              <div className="empty-state">
                <h2>Список заявки пуст</h2>
                <p>Добавьте позиции из каталога или подберите оттенки на палитре.</p>
                <div className="actions"><Link className="btn btn-primary" to="/catalog">Перейти в каталог</Link><Link className="btn btn-outline" to="/colors">Подбор по цвету</Link></div>
              </div>
            )}
          </div>

          <aside className="request-form card">
            <h2 className="h-small">Контакты</h2>
            <ContactForm subject={`Заявка на пряжу: ${items.length} поз.`} body={body} precheck={() => (items.length ? '' : 'Добавьте хотя бы одну позицию в заявку.')}
              fields={() => ({ 'Позиций': String(items.length) })} />
          </aside>
        </div>
      </section>
    </>
  );
}
