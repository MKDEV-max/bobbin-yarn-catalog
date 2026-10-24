import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Heart, LayoutGrid, Menu, Phone, Search, X } from 'lucide-react';
import { site } from '../config/site';
import { useStore } from '../state/store';

export const NAV = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/colors', label: 'Подбор по цвету' },
  { to: '/wholesale', label: 'Оптовым покупателям' },
  { to: '/about', label: 'О компании' },
  { to: '/delivery', label: 'Доставка и оплата' },
  { to: '/contacts', label: 'Контакты' },
];

/** Знак: бобина в круге — собственный, не копия логотипа референса */
export function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--color-accent)" />
      <path d="M15 11h10l5 19c-6 2.6-14 2.6-20 0z" fill="#E8C891" />
      <path d="M14.2 16.5h11.6M13 21.5h14M11.8 26.5h16.4" stroke="#6C3D08" strokeWidth="1.4" opacity=".55" />
      <rect x="18" y="7" width="4" height="5" rx="1" fill="#F1ECDF" />
    </svg>
  );
}

export function Header() {
  const { favorites, request } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => { setOpen(false); }, [loc.pathname, loc.search]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('scroll-lock', open);
    if (!open) return;
    const first = navRef.current?.querySelector<HTMLElement>('input, a');
    setTimeout(() => first?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
      if (e.key === 'Tab' && navRef.current) {
        const f = [toggleRef.current!, ...navRef.current.querySelectorAll<HTMLElement>('a, input, button')];
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('scroll-lock'); };
  }, [open]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : '/catalog');
  };

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-row">
        <Link to="/" className="logo" aria-label={`${site.name} — на главную`}>
          <LogoMark />
          <span className="logo-text"><b>{site.name}</b><small>каталог пряжи на бобинах</small></span>
        </Link>

        <form className="header-search" role="search" onSubmit={search}>
          <label className="sr-only" htmlFor="header-q">Поиск по каталогу</label>
          <Search aria-hidden="true" />
          <input id="header-q" className="input" type="search" placeholder="Цвет, состав, артикул" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <div className="header-actions">
          {site.contacts.phone && <a className="header-phone" href={`tel:${site.contacts.phone.replace(/[^\d+]/g, '')}`}><Phone aria-hidden="true" />{site.contacts.phone}</a>}
          <Link to="/catalog" className="btn btn-primary btn-sm header-catalog"><LayoutGrid aria-hidden="true" /><span>Каталог</span></Link>
          <Link to="/favorites" className="icon-btn header-fav" aria-label={`Избранное: ${favorites.length}`}>
            <Heart aria-hidden="true" />{favorites.length > 0 && <span className="count-badge" aria-hidden="true">{favorites.length}</span>}
          </Link>
          <Link to="/request" className="icon-btn" aria-label={`Заявка: ${request.length} позиций`}>
            <ClipboardList aria-hidden="true" />{request.length > 0 && <span className="count-badge" aria-hidden="true">{request.length}</span>}
          </Link>
          <button ref={toggleRef} className="icon-btn menu-toggle" type="button" aria-expanded={open} aria-controls="site-nav" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setOpen((v) => !v)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav ref={navRef} id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Основная навигация">
        <div className="container nav-inner">
          <form className="nav-search" role="search" onSubmit={search}>
            <label className="sr-only" htmlFor="nav-q">Поиск по каталогу</label>
            <input id="nav-q" className="input" type="search" placeholder="Поиск: цвет, состав, артикул" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <ul className="nav-list">
            {NAV.map((n) => <li key={n.to}><NavLink to={n.to}>{n.label}</NavLink></li>)}
            <li className="nav-mobile-only"><NavLink to="/favorites">Избранное{favorites.length > 0 && ` (${favorites.length})`}</NavLink></li>
          </ul>
          {(site.contacts.phone || site.contacts.email) && (
            <div className="nav-contacts">
              {site.contacts.phone && <a href={`tel:${site.contacts.phone.replace(/[^\d+]/g, '')}`}>{site.contacts.phone}</a>}
              {site.contacts.email && <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a>}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
