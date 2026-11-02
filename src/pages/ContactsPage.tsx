import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle, Send } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ContactForm } from '../components/ContactForm';
import { ContactCards } from '../components/ContactCards';
import { site } from '../config/site';
import { PageHead } from './PageHead';
import { Requisites } from './PrivacyPage';

type Row = { icon: ReactNode; label: string; node: ReactNode };

export function ContactsPage() {
  const c = site.contacts;
  const rows = [
    c.whatsapp && { icon: <MessageCircle />, label: 'WhatsApp', node: <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">Написать в WhatsApp</a> },
    c.telegram && { icon: <Send />, label: 'Telegram', node: <a href={`https://t.me/${c.telegram.replace(/^@/, '')}`} target="_blank" rel="noopener">@{c.telegram.replace(/^@/, '')}</a> },
    c.address && { icon: <MapPin />, label: 'Адрес', node: <span>{c.address}</span> },
    c.workHours && { icon: <Clock />, label: 'Время работы', node: <span>{c.workHours}</span> },
  ].filter(Boolean) as Row[];

  return (
    <>
      <Seo title="Контакты" description={`Контакты «${site.name}»: заявки на пряжу — на почту ${site.contacts.email}; телефон компании — для вопросов о работе компании, не для заказов.`} />
      <PageHead title="Контакты" lead="Заявки на пряжу принимаем по электронной почте. Телефон — для вопросов о работе компании." />
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container request-layout">
          <div>
            <ContactCards />
            <p className="contact-hint">Чтобы отправить заявку сразу на несколько цветов, соберите их в <Link to="/request">списке заявки</Link> — текст с цветами, скруткой и составом будет готов для письма.</p>
            {rows.length > 0 && (
              <ul className="contact-list" style={{ marginTop: 'var(--space-5)' }}>{rows.map((r) => <li key={r.label}><span className="contact-icon" aria-hidden="true">{r.icon}</span><span><small>{r.label}</small>{r.node}</span></li>)}</ul>
            )}
            <section className="card requisites-card" id="requisites" aria-labelledby="req-title">
              <h2 className="h-small" id="req-title">Реквизиты</h2>
              <Requisites />
              <p className="hint">Документы: <Link to="/privacy">Политика обработки персональных данных</Link> · <Link to="/consent">Согласие на обработку персональных данных</Link></p>
            </section>
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
