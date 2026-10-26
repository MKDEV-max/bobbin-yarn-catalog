import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, FileSpreadsheet, Palette, Truck } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ContactForm } from '../components/ContactForm';
import { CATALOG, catalogById } from '../data/catalog';
import { COMPOSITION_OPTIONS, compText } from '../data/variants';
import { IMAGES } from '../data/images';
import { useStore } from '../state/store';
import { PageHead } from './PageHead';

const COMPS = COMPOSITION_OPTIONS.map((c) => ({ id: c.id, label: c.note ? `${c.label} — ${c.note}` : c.label }));
const VOLUMES = ['до 50 кг', '50–200 кг', '200–1000 кг', 'более 1 т', 'регулярные поставки'];

export function WholesalePage() {
  const { request } = useStore();
  const [volume, setVolume] = useState('');
  const [comps, setComps] = useState<string[]>([]);
  const [colors, setColors] = useState('');
  const [withList, setWithList] = useState(true);
  const listItems = request.filter((i) => catalogById.has(i.colorId));

  const body = () => [
    'Запрос оптового прайса',
    `Объём: ${volume || 'не указан'}`,
    `Составы: ${comps.length ? comps.map((id) => COMPS.find((c) => c.id === id)?.label).join(', ') : 'не указаны'}`,
    colors.trim() && `Цвета: ${colors.trim()}`,
    withList && listItems.length > 0 && `Позиции из списка заявки: ${listItems.map((i) => `${catalogById.get(i.colorId)!.name}, ${i.twist}, ${compText(i.comp, i.wool, i.pan)}`).join('; ')}`,
  ].filter(Boolean).join('\n');

  return (
    <>
      <Seo title="Оптовым покупателям — прайс на бобинную пряжу" description={`Оптовые поставки бобинной пряжи: ${CATALOG.length} цветов, скрутка 16/2 и 32/2, составы от 100% ПАН до индивидуального. Запросите прайс и расчёт под ваш объём.`} />
      <PageHead title="Оптовым покупателям" lead="Трикотажным производствам, мастерским и магазинам: расчёт под объём, подбор цветов, образцы." />

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          <ul className="adv">
            <li><Palette aria-hidden="true" /><b>Широкая палитра</b><span>{CATALOG.length} оттенков с карты расцветок — подбор по образцам.</span></li>
            <li><Boxes aria-hidden="true" /><b>Остатки по каждому цвету</b><span>Видно, какие цвета есть на складе в большом объёме.</span></li>
            <li><FileSpreadsheet aria-hidden="true" /><b>Прайс по запросу</b><span>Цена зависит от объёма и состава — пришлём расчёт.</span></li>
            <li><Truck aria-hidden="true" /><b>Условия поставки</b><span>Сроки, упаковку и доставку согласуем под заказ.</span></li>
          </ul>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="ws-form-title">
        <div className="container request-layout">
          <div>
            <div className="section-head"><p className="eyebrow">Запрос прайса</p><h2 id="ws-form-title">Расскажите о задаче</h2>
              <p>Чем подробнее запрос, тем точнее расчёт. Цены на сайте не публикуются — их называет менеджер.</p></div>
            <figure className="about-photo">
              <img src={IMAGES.wholesale.srcSmall} width={800} height={500} alt={IMAGES.wholesale.alt} loading="lazy" decoding="async" />
              <figcaption>{IMAGES.wholesale.credit} · иллюстрация</figcaption>
            </figure>
            <p style={{ marginTop: 'var(--space-5)' }}>Уже знаете нужные оттенки? Соберите их на <Link to="/colors">палитре</Link> или в <Link to="/catalog">каталоге</Link> — список добавится к запросу.</p>
          </div>
          <div className="request-form card">
            <ContactForm subject="Запрос оптового прайса" body={body} submitLabel="Запросить прайс"
              fields={() => ({ 'Объём': volume || '—', 'Составы': comps.join(', ') || '—' })}>
              <fieldset className="filter-group">
                <legend>Планируемый объём</legend>
                <div className="chip-wrap">
                  {VOLUMES.map((v) => <button key={v} type="button" className="chip" aria-pressed={volume === v} onClick={() => setVolume(volume === v ? '' : v)}>{v}</button>)}
                </div>
              </fieldset>
              <fieldset className="filter-group">
                <legend>Состав</legend>
                {COMPS.map((c) => (
                  <label className="check" key={c.id}>
                    <input type="checkbox" checked={comps.includes(c.id)} onChange={() => setComps(comps.includes(c.id) ? comps.filter((x) => x !== c.id) : [...comps, c.id])} />
                    <span>{c.label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="field">
                <label htmlFor="ws-colors">Нужные цвета <span className="opt">(необязательно)</span></label>
                <textarea id="ws-colors" className="textarea" rows={2} placeholder="Например: антрацит, бирюза, белый" value={colors} onChange={(e) => setColors(e.target.value)} />
              </div>
              {listItems.length > 0 && (
                <label className="check">
                  <input type="checkbox" checked={withList} onChange={(e) => setWithList(e.target.checked)} />
                  <span>Приложить позиции из списка заявки ({listItems.length})</span>
                </label>
              )}
            </ContactForm>
          </div>
        </div>
      </section>
    </>
  );
}
