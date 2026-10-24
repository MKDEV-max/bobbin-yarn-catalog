import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ContactForm } from '../components/ContactForm';
import { site } from '../config/site';
import { PageHead } from './PageHead';

type Row = { icon: ReactNode; label: string; node: ReactNode };

export function ContactsPage() {
  const c = site.contacts, l = site.legal;
  const rows = [
    c.phone && { icon: <Phone />, label: 'Телефон', node: <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a> },
    c.email && { icon: <Mail />, label: 'Email', node: <a href={`mailto:${c.email}`}>{c.email}</a> },
    c.whatsapp && { icon: <MessageCircle />, label: 'WhatsApp', node: <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">Написать в WhatsApp</a> },
    c.telegram && { icon: <Send />, label: 'Telegram', node: <a href={`https://t.me/${c.telegram.replace(/^@/, '')}`} target="_blank" rel="noopener">@{c.telegram.replace(/^@/, '')}</a> },
    c.address && { icon: <MapPin />, label: 'Адрес', node: <span>{c.address}</span> },
    c.workHours && { icon: <Clock />, label: 'Время работы', node: <span>{c.workHours}</span> },
  ].filter(Boolean) as Row[];
  const legal = [l.name, l.inn && `ИНН ${l.inn}`, l.ogrn && `${l.ogrnLabel} ${l.ogrn}`, l.address].filter(Boolean) as string[];

  return (
    <>
      <Seo title="Контакты" description={`Контакты: ${site.name}. Вопросы по пряже, образцам и оптовым заказам.`} />
      <PageHead title="Контакты" lead="Задайте вопрос о пряже, образцах или условиях заказа." />
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container request-layout">
          <div>
            {rows.length ? (
              <ul className="contact-list">{rows.map((r) => <li key={r.label}><span className="contact-icon" aria-hidden="true">{r.icon}</span><span><small>{r.label}</small>{r.node}</span></li>)}</ul>
            ) : (
              <div className="card">
                <h2 className="h-small">Связь через сайт</h2>
                <p>Телефон и адрес пока не опубликованы. Напишите через форму — можно задать вопрос или сначала собрать список нужных цветов в <Link to="/request">заявке</Link>.</p>
              </div>
            )}
            {legal.length > 0 && (
              <div className="card" style={{ marginTop: 'var(--space-5)' }}>
                <h2 className="h-small">Реквизиты</h2>
                <ul className="bullets plain">{legal.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
          </div>
          <aside className="request-form card">
            <h2 className="h-small">Написать нам</h2>
            <ContactForm subject="Вопрос с сайта" body={() => 'Вопрос с сайта (страница «Контакты»)'} submitLabel="Отправить сообщение" />
          </aside>
        </div>
      </section>
    </>
  );
}
