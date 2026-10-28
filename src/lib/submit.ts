/*
 * Отправка заявок через Web3Forms (https://docs.web3forms.com/getting-started/api-reference):
 * POST JSON на https://api.web3forms.com/submit, успех — только ответ { "success": true }.
 * Работает, когда в src/config/site.ts указан form.accessKey (UUID из письма Web3Forms).
 * Без ключа ничего не отправляется: интерфейс показывает текст заявки и предлагает отправить его письмом.
 */
import { site } from '../config/site';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Ключ Web3Forms указан и похож на настоящий (UUID) */
export const formReady = () => !!site.form.endpoint && (!site.form.endpoint.includes('web3forms') || UUID.test(site.form.accessKey.trim()));

/** Ошибка отправки с текстом от сервиса (показывается посетителю) */
export class SubmitError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'SubmitError'; }
}

export type Channel = { label: string; href: string; external?: boolean };

/** Каналы связи из конфигурации — для ручной отправки заявки */
export function channels(subject: string, text: string): Channel[] {
  const c = site.contacts, list: Channel[] = [];
  if (c.email) list.push({ label: `Отправить на ${c.email}`, href: `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` });
  if (c.whatsapp) list.push({ label: 'Отправить в WhatsApp', href: `https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, external: true });
  if (c.telegram) list.push({ label: `Открыть Telegram @${c.telegram.replace(/^@/, '')}`, href: `https://t.me/${c.telegram.replace(/^@/, '')}`, external: true });
  // Телефон компании не предлагается для заявок — он не для оформления заказов
  return list;
}

/**
 * Отправка заявки. Поля fields приходят в письмо как есть (каждое — отдельной строкой письма).
 * Успех — только при JSON-ответе success === true; иначе бросается SubmitError с текстом сервиса.
 */
export async function sendRequest(subject: string, fields: Record<string, string>, replyTo: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const payload: Record<string, string> = { subject, from_name: `Сайт «${site.name}»`, replyto: replyTo, ...fields };
    if (site.form.accessKey) payload.access_key = site.form.accessKey.trim();
    const r = await fetch(site.form.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), signal: ctrl.signal,
    });
    const j = await r.json().catch(() => null) as { success?: boolean; message?: string; error?: string; body?: { message?: string } } | null;
    if (!r.ok || !j || j.success !== true) {
      const msg = j?.body?.message || j?.message || j?.error || (r.status === 429 ? 'слишком много заявок подряд, попробуйте позже' : `ошибка ${r.status}`);
      throw new SubmitError(msg, r.status);
    }
  } finally { clearTimeout(timer); }
}

/* Проверки полей — возвращают текст ошибки или '' */
export const validate = {
  name: (v: string) => (v.trim().length >= 2 ? '' : 'Укажите имя или название компании'),
  email: (v: string) => (!v.trim() ? 'Укажите email — на него придёт ответ' : /^[^\s@]+@[^\s@]+\.[a-zа-яё]{2,}$/i.test(v.trim()) ? '' : 'Проверьте email: например, zakupki@company.ru'),
  phone: (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return 'Укажите телефон для связи';
    if (/[^\d\s()+-]/.test(v)) return 'В телефоне допустимы цифры, пробелы, скобки, «+» и «-»';
    return d.length >= 10 && d.length <= 15 ? '' : 'Проверьте номер: например, +7 900 123-45-67';
  },
  consent: (v: boolean) => (v ? '' : 'Нужно согласие на обработку данных'),
};
export function formatPhone(v: string) {
  const d = v.replace(/\D/g, '');
  return d.length === 11 && /^[78]/.test(d) ? `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}` : v;
}
