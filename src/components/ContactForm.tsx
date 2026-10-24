import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { channels, formReady, formatPhone, sendRequest, validate } from '../lib/submit';

type Props = {
  subject: string;
  /** Текст заявки без контактов (позиции, объём и т. п.) */
  body: () => string;
  /** Дополнительные поля для отправки в сервис */
  fields?: () => Record<string, string>;
  /** Проверка перед отправкой (например, «список пуст») — вернуть текст ошибки или '' */
  precheck?: () => string;
  submitLabel?: string;
  onSent?: () => void;
  children?: ReactNode;
};
type Errors = Partial<Record<'name' | 'email' | 'phone' | 'consent', string>>;
type Result = null | { kind: 'sent' | 'manual' | 'error'; text: string; email: string };

export function ContactForm({ subject, body, fields, precheck, submitLabel = 'Отправить заявку', onSent, children }: Props) {
  const [v, setV] = useState({ name: '', email: '', phone: '', comment: '', consent: false, website: '' });
  const [err, setErr] = useState<Errors>({});
  const [pre, setPre] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [copied, setCopied] = useState(false);

  const check = (k: keyof Errors, val = v[k]) => {
    const m = k === 'consent' ? validate.consent(val as boolean) : validate[k](val as string);
    setErr((e) => ({ ...e, [k]: m }));
    return !m;
  };
  const fullText = () => [body(), '', `Компания / имя: ${v.name.trim()}`, `Email: ${v.email.trim()}`, `Телефон: ${v.phone.trim()}`, v.comment.trim() ? `Комментарий: ${v.comment.trim()}` : null].filter((x) => x !== null).join('\n');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || v.website) return;                       // двойная отправка / бот
    const p = precheck?.() ?? ''; setPre(p);
    const ok = (['name', 'email', 'phone', 'consent'] as const).map((k) => check(k)).every(Boolean);
    if (p || !ok) {
      const first = document.querySelector<HTMLElement>('.contact-form [aria-invalid="true"]');
      first?.focus();
      return;
    }
    const text = fullText();
    if (!formReady()) { setResult({ kind: 'manual', text, email: v.email.trim() }); return; }
    setBusy(true); setFailed('');
    try {
      await sendRequest(subject, { 'Заявка': body(), 'Компания / имя': v.name.trim(), Email: v.email.trim(), 'Телефон': v.phone.trim(), 'Комментарий': v.comment.trim() || '—', ...(fields?.() ?? {}) }, v.email.trim());
      setResult({ kind: 'sent', text, email: v.email.trim() });
      onSent?.();
    } catch (x) {
      setFailed(x instanceof Error && x.name === 'AbortError' ? 'сервис не ответил вовремя' : navigator.onLine === false ? 'нет подключения к интернету' : 'сервис отправки вернул ошибку');
    } finally { setBusy(false); }
  };

  if (result) {
    const list = result.kind === 'sent' ? [] : channels(subject, result.text);
    return (
      <div className={`result result-${result.kind}`} role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        {result.kind === 'sent' ? (
          <>
            <h3>Заявка отправлена</h3>
            <p>Менеджер ответит на {result.email}. Если письма долго нет, проверьте папку «Спам».</p>
          </>
        ) : (
          <>
            <h3>{result.kind === 'error' ? 'Заявку не удалось отправить' : 'Заявка подготовлена, но не отправлена'}</h3>
            <p>{result.kind === 'error' ? 'Сервис отправки сейчас недоступен. Ваши данные сохранены.' : 'Автоматическая отправка заявок на сайте пока не подключена, поэтому мы не отправили её за вас.'}{' '}
              {list.length ? 'Отправьте её удобным способом — текст уже готов:' : 'Скопируйте текст заявки — он понадобится при обращении к продавцу.'}</p>
            {list.length > 0 && <div className="result-channels">{list.map((c) => <a key={c.href} className="btn btn-primary" href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener' } : {})}>{c.label}</a>)}</div>}
            <label className="field" style={{ width: '100%' }}>
              <span className="field-label">Текст заявки</span>
              <textarea className="textarea" readOnly value={result.text} rows={8} />
            </label>
            <button className="btn btn-outline" type="button" onClick={() => { navigator.clipboard?.writeText(result.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, () => {}); }}>
              {copied ? 'Скопировано' : 'Скопировать текст заявки'}
            </button>
          </>
        )}
        <button className="btn btn-ghost" type="button" onClick={() => setResult(null)}>Вернуться к форме</button>
      </div>
    );
  }

  const fieldCls = (k: keyof Errors) => `field${err[k] ? ' is-invalid' : ''}`;
  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      {children}
      {pre && <p className="alert alert-error" role="alert">{pre}</p>}
      <div className="form-grid">
        <div className={fieldCls('name')}>
          <label htmlFor="cf-name">Компания или имя <span className="req">*</span></label>
          <input id="cf-name" className="input" autoComplete="organization" value={v.name} aria-invalid={!!err.name} aria-describedby="cf-name-e"
            onChange={(e) => { setV({ ...v, name: e.target.value }); if (err.name) check('name', e.target.value); }} onBlur={() => v.name && check('name')} />
          <span className="error" id="cf-name-e" aria-live="polite">{err.name}</span>
        </div>
        <div className={fieldCls('email')}>
          <label htmlFor="cf-email">Email <span className="req">*</span></label>
          <input id="cf-email" className="input" type="email" inputMode="email" autoComplete="email" placeholder="zakupki@company.ru" value={v.email} aria-invalid={!!err.email} aria-describedby="cf-email-h cf-email-e"
            onChange={(e) => { setV({ ...v, email: e.target.value }); if (err.email) check('email', e.target.value); }} onBlur={() => v.email && check('email')} />
          <span className="hint" id="cf-email-h">На этот адрес придёт ответ и расчёт</span>
          <span className="error" id="cf-email-e" aria-live="polite">{err.email}</span>
        </div>
        <div className={fieldCls('phone')}>
          <label htmlFor="cf-phone">Телефон <span className="req">*</span></label>
          <input id="cf-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 123-45-67" value={v.phone} aria-invalid={!!err.phone} aria-describedby="cf-phone-e"
            onChange={(e) => { setV({ ...v, phone: e.target.value }); if (err.phone) check('phone', e.target.value); }}
            onBlur={() => { const f = formatPhone(v.phone); setV({ ...v, phone: f }); if (f) check('phone', f); }} />
          <span className="error" id="cf-phone-e" aria-live="polite">{err.phone}</span>
        </div>
        <div className="field full">
          <label htmlFor="cf-comment">Комментарий или реквизиты <span className="opt">(необязательно)</span></label>
          <textarea id="cf-comment" className="textarea" rows={3} placeholder="Город доставки, сроки, оборудование, реквизиты" value={v.comment} onChange={(e) => setV({ ...v, comment: e.target.value })} />
        </div>
        <div className="sr-only" aria-hidden="true"><label>Не заполняйте<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} /></label></div>
        <div className={`${fieldCls('consent')} full`}>
          <label className="check"><input type="checkbox" checked={v.consent} aria-invalid={!!err.consent} aria-describedby="cf-consent-e" onChange={(e) => { setV({ ...v, consent: e.target.checked }); check('consent', e.target.checked); }} />
            <span>Согласен на обработку персональных данных по <Link to="/privacy" target="_blank">политике конфиденциальности</Link> <span className="req">*</span></span></label>
          <span className="error" id="cf-consent-e" aria-live="polite">{err.consent}</span>
        </div>
      </div>
      {failed && (
        <div className="alert alert-error" role="alert">
          <b>Заявка не отправлена: {failed}.</b>
          <span>Попробуйте ещё раз или отправьте заявку другим способом.</span>
          <button className="btn btn-outline btn-sm" type="button" style={{ justifySelf: 'start' }} onClick={() => setResult({ kind: 'error', text: fullText(), email: v.email.trim() })}>Отправить другим способом</button>
        </div>
      )}
      <button className="btn btn-primary btn-block form-submit" type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Отправляем…' : submitLabel}</button>
      <p className="hint">{formReady() ? 'Заявка уйдёт продавцу на почту. ' : ''}Данные нужны только для ответа на заявку — подробнее в <Link to="/privacy">политике</Link>.</p>
    </form>
  );
}
