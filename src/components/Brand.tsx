/*
 * Фирменные элементы «Кавказская шерсть» — перенесены с сайта компании (kavkazskaya-sherst):
 * логотип (оригинальный файл assets/logo.webp → public/brand/logo.webp) и силуэт гор.
 */
import { Link } from 'react-router-dom';
import { site } from '../config/site';

export const brandAsset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

/**
 * Логотип в шапке и подвале: как на сайте компании — круглая эмблема (верхняя часть
 * оригинального квадратного логотипа с бараном и горами) + название и подпись.
 */
export function Logo({ lazy }: { lazy?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label={`${site.name} — на главную`}>
      <span className="logo-mark">
        <img src={brandAsset(site.logo)} width={1024} height={1024} alt="" decoding="async" loading={lazy ? 'lazy' : undefined} />
      </span>
      <span className="logo-text"><span className="logo-name">{site.name}</span><span className="logo-sub">{site.logoSub}</span></span>
    </Link>
  );
}

/** Силуэт гор под тёмным первым экраном (координаты — из icons.svg сайта компании) */
export function Ridge({ low }: { low?: boolean }) {
  return (
    <svg className={`ridge${low ? ' ridge-low' : ''}`} viewBox={low ? '0 0 1600 120' : '0 0 1600 160'} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <g transform={`scale(1 ${low ? 0.6 : 0.8})`}>
        <polygon fill="#4E5E58" points="0,200 0,125 90,95 170,110 290,40 380,95 470,70 560,120 700,22 800,90 880,60 980,118 1100,35 1210,100 1300,75 1420,115 1520,55 1600,95 1600,200" />
        <polygon fill="#F3EFE4" points="290,40 252,62 266,58 278,68 292,60 306,66 326,62" />
        <polygon fill="#F3EFE4" points="700,22 666,46 680,42 692,52 706,44 720,50 735,46" />
        <polygon fill="#F3EFE4" points="1100,35 1068,57 1082,53 1094,63 1108,55 1120,61 1137,57" />
        <polygon fill="#F3EFE4" points="1520,55 1490,73 1502,70 1512,78 1524,71 1536,76 1556,73" />
        <polygon fill="#35474A" points="0,200 0,150 120,130 240,145 360,110 480,150 620,125 780,150 940,118 1060,150 1200,128 1360,152 1500,120 1600,140 1600,200" />
        <polygon fill="#22343A" points="0,200 0,168 150,125 260,160 420,112 560,172 720,120 860,166 1010,115 1160,170 1300,128 1440,166 1600,134 1600,200" />
      </g>
    </svg>
  );
}

/** Тёмная шапка внутренних страниц с силуэтом гор — как .page-hero на сайте компании */
export function PageHero({ crumbs, title, lead, compact, children }: { crumbs: { to?: string; label: string }[]; title: string; lead?: React.ReactNode; compact?: boolean; children?: React.ReactNode }) {
  return (
    <header className={`page-hero on-dark${compact ? ' page-hero-compact' : ''}`}>
      <div className="container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <ol>
            <li><Link to="/">Главная</Link></li>
            {crumbs.map((c) => <li key={c.label} aria-current={c.to ? undefined : 'page'}>{c.to ? <Link to={c.to}>{c.label}</Link> : c.label}</li>)}
          </ol>
        </nav>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
      <Ridge low />
    </header>
  );
}
