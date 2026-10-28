import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Heart, Mail, Search } from 'lucide-react';
import { site } from '../config/site';
import { useStore } from '../state/store';
import { Logo } from './Brand';

export const NAV: { to: string; label: string; compact?: boolean }[] = [
  { to: '/about', label: 'О производстве' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/colors', label: 'Подбор по цвету' },
  { to: '/wholesale', label: 'Оптовым покупателям', compact: true }, // в строке меню на десктопе — кнопка «Получить КП»
  { to: '/delivery', label: 'Оплата и доставка' },
  { to: '/contacts', label: 'Контакты' },
];

/** Шапка как на сайте компании: логотип, меню, телефон, «Получить КП», бургер на мобильных */
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
      <div className="container header-inner">
        <Logo />

        <nav ref={navRef} id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Основная навигация">
          <form className="nav-search" role="search" onSubmit={search}>
            <label className="sr-only" htmlFor="nav-q">Поиск по каталогу</label>
            <input id="nav-q" className="input" type="search" placeholder="Поиск пряжи: цвет, состав, артикул" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <ul className="nav-list">
            {NAV.map((n) => <li key={n.to} className={n.compact ? 'nav-menu-only' : undefined}><NavLink to={n.to}>{n.label}</NavLink></li>)}
            <li className="nav-mobile-only"><NavLink to="/favorites">Избранное{favorites.length > 0 && ` (${favorites.length})`}</NavLink></li>
            <li className="nav-mobile-only"><NavLink to="/request">Заявка{request.length > 0 && ` (${request.length})`}</NavLink></li>
          </ul>
          {site.contacts.email && (
            <div className="nav-contacts">
              <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a>
              <small>Заявки на пряжу — на почту</small>
            </div>
          )}
        </nav>

        <Link to="/catalog" className="icon-btn header-search-btn" aria-label="Поиск по каталогу"><Search aria-hidden="true" /></Link>
        <Link to="/favorites" className="icon-btn header-fav" aria-label={`Избранное: ${favorites.length}`}>
          <Heart aria-hidden="true" />{favorites.length > 0 && <span className="count-badge" aria-hidden="true">{favorites.length}</span>}
        </Link>
        <Link to="/request" className="icon-btn header-req" aria-label={`Заявка: ${request.length} позиций`}>
          <ClipboardList aria-hidden="true" />{request.length > 0 && <span className="count-badge" aria-hidden="true">{request.length}</span>}
        </Link>
        <Link to="/wholesale" className="btn btn-primary btn-sm header-cta" aria-label="Получить коммерческое предложение">
          <Mail aria-hidden="true" /><span className="btn-label">Получить КП</span>
        </Link>
        <button ref={toggleRef} className="icon-btn menu-toggle" type="button" aria-expanded={open} aria-controls="site-nav" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setOpen((v) => !v)}>
          <span className="bars" aria-hidden="true"><span /><span /><span /></span>
        </button>
      </div>
    </header>
  );
}
