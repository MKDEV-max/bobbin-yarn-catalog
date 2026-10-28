import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHead } from './PageHead';
import { ContactForm } from '../components/ContactForm';
import { ColorMark } from '../components/ColorSwatch';
import { capName, catalogById } from '../data/catalog';
import { compText } from '../data/variants';
import { useStore, type RequestItem, type Unit } from '../state/store';

/** Строка позиции для текста заявки: цвет, артикул, скрутка, состав (с процентами), объём, комментарий */
export function requestLine(i: RequestItem, n: number) {
  const c = catalogById.get(i.colorId)!;
  return `${n}. Цвет «${c.name}»${c.code ? ` (арт. ${c.code})` : ''} [${i.colorId}]; скрутка ${i.twist}; состав: ${compText(i.comp, i.wool, i.pan)}; объём: ${i.qty ? `${i.qty} ${i.unit === 'kg' ? 'кг' : 'бобин'}` : 'не указан'}${i.comment ? `; ${i.comment}` : ''}`;
}

export function RequestPage() {
  const { request, updateItem, removeFromRequest, clearRequest } = useStore();
  const items = request.filter((i) => catalogById.has(i.colorId));
  const totalKg = items.filter((i) => i.unit === 'kg').reduce((s, i) => s + (parseFloat(i.qty.replace(',', '.')) || 0), 0);
  const totalBobbins = items.filter((i) => i.unit === 'bobbins').reduce((s, i) => s + (parseInt(i.qty, 10) || 0), 0);
  const body = () => ['Заявка на бобинную пряжу:', ...items.map((i, n) => requestLine(i, n + 1))].join('\n');

  return (
    <>
      <Seo title="Заявка на пряжу" description="Список выбранных конфигураций пряжи: цвет, скрутка и состав. Укажите объём и отправьте заявку на расчёт." noindex />
      <PageHead title="Заявка" crumb="Заявка" lead="Укажите объём по каждой конфигурации и контакты — менеджер ответит с ценой, наличием и условиями." />

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container request-layout">
          <div>
            {items.length ? (
              <>
                <div className="head-row" style={{ marginBottom: 'var(--space-4)' }}>
                  <h2 className="h-small">Позиций: {items.length}</h2>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={clearRequest}>Очистить список</button>
                </div>
                <ul className="req-list">
                  {items.map((i) => {
                    const c = catalogById.get(i.colorId)!;
                    const name = capName(c.name.trim());
                    return (
                      <li key={i.key} className="req-item">
                        <div className="req-visual"><ColorMark c={c} size="md" /></div>
                        <div className="req-main">
                          <Link to={`/product/${c.id}`} className="req-title">{name}{c.code && <span className="muted"> · {c.code}</span>}</Link>
                          <dl className="req-config">
                            <dt>Скрутка</dt><dd>{i.twist}</dd>
                            <dt>Состав</dt><dd>{compText(i.comp, i.wool, i.pan)}</dd>
                          </dl>
                          <div className="req-fields">
                            <div className="field">
                              <label htmlFor={`q-${i.key}`}>Объём</label>
                              <div className="qty">
                                <input id={`q-${i.key}`} className="input" inputMode="decimal" placeholder="Например, 50" value={i.qty} onChange={(e) => updateItem(i.key, { qty: e.target.value.replace(/[^\d.,]/g, '') })} />
                                <select className="select" aria-label="Единица" value={i.unit} onChange={(e) => updateItem(i.key, { unit: e.target.value as Unit })}>
                                  <option value="kg">кг</option><option value="bobbins">бобин</option>
                                </select>
                              </div>
                            </div>
                            <div className="field">
                              <label htmlFor={`c-${i.key}`}>Комментарий <span className="opt">(необязательно)</span></label>
                              <input id={`c-${i.key}`} className="input" placeholder="Например: нужен образец" value={i.comment} onChange={(e) => updateItem(i.key, { comment: e.target.value })} />
                            </div>
                          </div>
                        </div>
                        <button className="icon-btn req-remove" type="button" onClick={() => removeFromRequest(i.key)} aria-label={`Удалить: ${name}, ${i.twist}, ${compText(i.comp, i.wool, i.pan)}`}><Trash2 aria-hidden="true" /></button>
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
                <p>Выберите цвет в каталоге, затем скрутку и состав — и нажмите «В заявку».</p>
                <div className="actions"><Link className="btn btn-primary" to="/catalog">Смотреть каталог</Link><Link className="btn btn-outline" to="/colors">Подбор по цвету</Link></div>
              </div>
            )}
          </div>

          <aside className="request-form card">
            <h2 className="h-small">Контакты</h2>
            <ContactForm subject={`Заявка на пряжу: ${items.length} поз.`} body={body} precheck={() => (items.length ? '' : 'Добавьте хотя бы одну позицию в заявку.')}
              fields={() => ({ 'Позиций': String(items.length), ...Object.fromEntries(items.map((i, n) => [`Позиция ${n + 1}`, requestLine(i, n + 1).replace(/^\d+\.\s*/, '')])) })}
              onSent={clearRequest} />
          </aside>
        </div>
      </section>
    </>
  );
}
