import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { META, formatDate } from '../data/catalog';
import { LogoMark, NAV } from './Header';

export function Footer() {
  const c = site.contacts, l = site.legal;
  const contacts = [
    c.phone && <a key="p" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a>,
    c.email && <a key="e" href={`mailto:${c.email}`}>{c.email}</a>,
    c.whatsapp && <a key="w" href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">WhatsApp</a>,
    c.telegram && <a key="t" href={`https://t.me/${c.telegram.replace(/^@/, '')}`} target="_blank" rel="noopener">Telegram</a>,
    c.address && <span key="a">{c.address}</span>,
    c.workHours && <span key="h">{c.workHours}</span>,
  ].filter(Boolean);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="logo" aria-label={`${site.name} — на главную`}><LogoMark /><span className="logo-text"><b>{site.name}</b><small>каталог пряжи на бобинах</small></span></Link>
          <p>{site.tagline}. Палитра — по карте расцветок, наличие — по данным склада на {formatDate(META.stockDate)}, уточняйте у менеджера.</p>
          <Link to="/request" className="btn btn-light btn-sm">Связаться и отправить заявку</Link>
        </div>
        <nav aria-label="Разделы сайта">
          <h2>Разделы</h2>
          <ul className="footer-list">
            <li><Link to="/">Главная</Link></li>
            {NAV.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
            <li><Link to="/favorites">Избранное</Link></li>
            <li><Link to="/request">Заявка</Link></li>
          </ul>
        </nav>
        <div>
          <h2>Контакты</h2>
          <ul className="footer-list">
            {contacts.length ? contacts.map((x, i) => <li key={i}>{x}</li>) : <li><Link to="/request">Отправить заявку через сайт</Link></li>}
          </ul>
        </div>
        <div>
          <h2>Информация</h2>
          <ul className="footer-list">
            <li><Link to="/delivery">Условия заказа и доставки</Link></li>
            <li><Link to="/privacy">Политика конфиденциальности</Link></li>
            {l.name && <li>{l.name}</li>}
            {l.inn && <li>ИНН {l.inn}</li>}
            {l.ogrn && <li>{l.ogrnLabel} {l.ogrn}</li>}
            {l.address && <li>{l.address}</li>}
          </ul>
        </div>
      </div>
      <div className="container footer-legal">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>Цены — по запросу. Информация на сайте не является публичной офертой. Цвета на экране приблизительные.</span>
      </div>
    </footer>
  );
}
