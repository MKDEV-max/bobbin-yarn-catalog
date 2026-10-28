import { Mail, Phone } from 'lucide-react';
import { site } from '../config/site';

/*
 * Карточки контактов: почта — основной канал для заявок на пряжу (выделена),
 * телефон — для вопросов о работе компании, с постоянно видимым предупреждением «не для заказов».
 */
export function ContactCards() {
  const c = site.contacts;
  return (
    <div className="contact-cards">
      {c.email && (
        <section className="contact-card contact-card-main" aria-labelledby="cc-mail">
          <span className="contact-card-icon" aria-hidden="true"><Mail /></span>
          <h2 id="cc-mail">Электронная почта</h2>
          <p className="contact-card-tag">Заявки на пряжу</p>
          <a className="contact-card-value" href={`mailto:${c.email}`}>{c.email}</a>
          <p className="contact-card-note">{c.emailNote}</p>
          <a className="btn btn-primary contact-card-btn" href={`mailto:${c.email}?subject=${encodeURIComponent('Заявка на пряжу')}`}><Mail aria-hidden="true" />Написать на почту</a>
        </section>
      )}
      {c.phone && (
        <section className="contact-card contact-card-phone" aria-labelledby="cc-phone">
          <span className="contact-card-icon" aria-hidden="true"><Phone /></span>
          <h2 id="cc-phone">Телефон компании</h2>
          <p className="contact-card-warning" role="note">{c.phoneWarning}</p>
          <a className="contact-card-value" href={`tel:${c.phoneTel}`}>{c.phone}</a>
          <p className="contact-card-note">{c.phoneNote}.</p>
        </section>
      )}
    </div>
  );
}
