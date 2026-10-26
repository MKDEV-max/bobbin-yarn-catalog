import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { OFFERS, capName, type CatalogColor } from '../data/catalog';
import { COMPOSITION_OPTIONS, TWISTS, compText, configKey, validateCustom, type CompId, type Twist } from '../data/variants';
import { useStore, useToast } from '../state/store';

/*
 * Выбор конфигурации внутри карточки цвета: сначала скрутка (обязательно), затем состав.
 * «Индивидуальный состав» открывает поля процентов; сумма проверяется на лету, неверная конфигурация
 * не добавляется в заявку. Проценты сохраняются при переключении скрутки и состава.
 */
export function Configurator({ color, initialTwist = null, initialComp = null, compact, detailsLink }: {
  color: CatalogColor; initialTwist?: Twist | null; initialComp?: CompId | null; compact?: boolean; detailsLink?: boolean;
}) {
  const uid = useId();
  const { addToRequest, countForColor } = useStore();
  const toast = useToast();
  const [twist, setTwist] = useState<Twist | null>(initialTwist);
  const [comp, setComp] = useState<CompId | null>(initialComp);
  const [wool, setWool] = useState('');
  const [pan, setPan] = useState('');
  const [error, setError] = useState('');
  const customErr = comp === 'custom' && (wool !== '' || pan !== '') ? validateCustom(wool, pan) : '';
  const offer = twist && comp ? OFFERS[configKey(color.id, twist, comp)] : undefined;
  const inReq = countForColor(color.id);

  const add = () => {
    if (!twist) { setError('Выберите скрутку'); return; }
    if (!comp) { setError('Выберите состав'); return; }
    if (comp === 'custom') { const e = validateCustom(wool, pan); if (e) { setError(e); return; } }
    setError('');
    const r = addToRequest({ colorId: color.id, twist, comp, wool: comp === 'custom' ? Number(wool) : null, pan: comp === 'custom' ? Number(pan) : null });
    const what = `${twist}, ${comp === 'custom' ? `${wool}% шерсть / ${pan}% ПАН` : COMPOSITION_OPTIONS.find((c) => c.id === comp)!.short}`;
    toast.show(r === 'added' ? `В заявке: ${capName(color.name.trim())}, ${what}` : r === 'exists' ? `Эта конфигурация уже в заявке: ${what}` : 'Проверьте параметры');
  };
  const setPct = (v: string, set: (s: string) => void) => { set(v.replace(/[^\d]/g, '').slice(0, 3)); setError(''); };

  return (
    <div className={`cfg${compact ? ' cfg-compact' : ''}`}>
      <div className="cfg-row" role="radiogroup" aria-labelledby={`${uid}-t`} aria-required="true">
        <span className="cfg-label" id={`${uid}-t`}>Скрутка</span>
        <div className="seg">
          {TWISTS.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={twist === t} className="seg-btn" onClick={() => { setTwist(t); setError(''); }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="cfg-row">
        <label className="cfg-label" htmlFor={`${uid}-c`}>Состав</label>
        <select id={`${uid}-c`} className="select select-cfg" value={comp ?? ''} disabled={!twist}
          aria-describedby={!twist ? `${uid}-c-h` : undefined}
          onChange={(e) => { setComp((e.target.value || null) as CompId | null); setError(''); }}>
          <option value="">{twist ? 'Выберите состав' : 'Сначала скрутка'}</option>
          {COMPOSITION_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.note ? `${c.label} — ${c.note}` : c.label}</option>)}
        </select>
        {!twist && <span className="sr-only" id={`${uid}-c-h`}>Состав выбирается после скрутки</span>}
      </div>

      {comp === 'custom' && (
        <fieldset className="cfg-custom">
          <legend className="sr-only">Индивидуальный состав, проценты</legend>
          <label>Шерсть, %<input className="input" inputMode="numeric" value={wool} placeholder="20" aria-invalid={!!customErr} onChange={(e) => setPct(e.target.value, setWool)} /></label>
          <label>ПАН, %<input className="input" inputMode="numeric" value={pan} placeholder="80" aria-invalid={!!customErr} onChange={(e) => setPct(e.target.value, setPan)} /></label>
          <span className={`cfg-sum${customErr ? ' is-bad' : wool && pan ? ' is-ok' : ''}`} aria-live="polite">
            {customErr || (wool && pan ? `Сумма: 100% ✓` : 'Сумма должна быть 100%')}
          </span>
        </fieldset>
      )}

      {twist && comp && comp !== 'custom' && <p className="cfg-pick">{twist} · {compText(comp)}</p>}
      <p className="cfg-price">{offer?.priceRub ? `${offer.priceRub.toLocaleString('ru-RU')} ₽/кг` : 'Цена по запросу'}</p>
      {error && <p className="cfg-error" role="alert">{error}</p>}

      <div className="cfg-actions">
        {detailsLink && <Link className="btn btn-outline btn-sm" to={`/product/${color.id}`}>Подробнее<span className="sr-only">: {color.name}</span></Link>}
        <button className="btn btn-primary btn-sm" type="button" onClick={add}><Plus aria-hidden="true" />В заявку</button>
      </div>
      {inReq > 0 && <Link className="cfg-inreq" to="/request">В заявке конфигураций этого цвета: {inReq}</Link>}
    </div>
  );
}
