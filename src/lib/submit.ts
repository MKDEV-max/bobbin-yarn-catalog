/*
 * Отправка заявок. Работает только если в src/config/site.ts настроен form.endpoint (+ accessKey для Web3Forms).
 * Иначе ничего не отправляется: интерфейс показывает текст заявки и способы отправить его самостоятельно.
 * Чтобы подключить свой сервер, замените endpoint — тело запроса: JSON (см. payload ниже).
 */
import { site } from '../config/site';

export const formReady = () => !!site.form.endpoint && (!site.form.endpoint.includes('web3forms') || !!site.form.accessKey);

export type Channel = { label: string; href: string; external?: boolean };

/** Каналы связи из конфигурации — для ручной отправки заявки */
export function channels(subject: string, text: string): Channel[] {
  const c = site.contacts, list: Channel[] = [];
  if (c.email) list.push({ label: `Отправить на ${c.email}`, href: `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` });
  if (c.whatsapp) list.push({ label: 'Отправить в WhatsApp', href: `https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, external: true });
  if (c.telegram) list.push({ label: `Открыть Telegram @${c.telegram.replace(/^@/, '')}`, href: `https://t.me/${c.telegram.replace(/^@/, '')}`, external: true });
  if (c.phone) list.push({ label: `Позвонить: ${c.phone}`, href: `tel:${c.phone.replace(/[^\d+]/g, '')}` });
  return list;
}

export async function sendRequest(subject: string, fields: Record<string, string>, replyTo: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const payload: Record<string, string> = { subject, from_name: `Сайт «${site.name}»`, replyto: replyTo, ...fields };
    if (site.form.accessKey) payload.access_key = site.form.accessKey;
    const r = await fetch(site.form.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new Error(j.message || `ошибка ${r.status}`);
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
