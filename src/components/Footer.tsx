import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { Logo } from './Brand';
import { NAV } from './Header';

/** Подвал — структура и тексты как на сайте компании «Кавказская шерсть» */
export function Footer() {
  const c = site.contacts, l = site.legal;
  const contacts = [
    c.phone && <a key="p" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a>,
    c.email && <a key="e" href={`mailto:${c.email}`}>{c.email}</a>,
    c.whatsapp && <a key="w" href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">WhatsApp</a>,
    c.telegram && <a key="t" href={`https://t.me/${c.telegram.replace(/^@/, '')}`} target="_blank" rel="noopener">Telegram</a>,
    c.workHours && <span key="h">{c.workHours}</span>,
    <span key="r">Производство: {site.region}</span>,
    c.address && <span key="a">{c.address}</span>,
  ].filter(Boolean);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo lazy />
            <p>Мытая шерсть, топс и шерстяная пряжа из шерсти дагестанского мериноса. Производство — {site.region}. Поставки для текстильных, трикотажных и ковровых производств по всей России.</p>
            <Link to="/contacts" className="btn btn-sand btn-sm">Связаться с нами</Link>
          </div>
          <nav aria-label="Разделы сайта">
            <h2>Разделы</h2>
            <ul className="footer-list">
              <li><Link to="/">Главная</Link></li>
              {NAV.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
              <li><Link to="/request">Заявка</Link></li>
            </ul>
          </nav>
          <div>
            <h2>Контакты</h2>
            <ul className="footer-list">{contacts.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div>
            <h2>Документы</h2>
            <ul className="footer-list">
              <li><Link to="/privacy">Политика обработки персональных данных</Link></li>
              {l.name && <li>{l.name}</li>}
              {l.inn && <li>ИНН&nbsp;{l.inn}</li>}
              {l.ogrn && <li>{l.ogrnLabel}&nbsp;{l.ogrn}</li>}
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} «{site.name}»</span>
          <span>Цены — по запросу. Информация на сайте не является публичной офертой. Цвета на экране приблизительные.</span>
        </div>
      </div>
    </footer>
  );
}
