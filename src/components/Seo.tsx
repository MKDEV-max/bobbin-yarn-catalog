/*
 * Заголовок и мета-теги страницы. При сборке те же теги записываются в HTML каждого
 * маршрута (scripts/prerender.mjs), поэтому они видны поисковикам и без выполнения JS.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { site } from '../config/site';

function setMeta(selector: string, attr: string, value: string, create: () => HTMLElement) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
}

export function Seo({ title, description, noindex }: { title: string; description: string; noindex?: boolean }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const full = title.includes(site.name) ? title : `${title} — ${site.name}`;
    document.title = full;
    // Как в prerender.mjs: адреса страниц со слешем на конце (так их отдаёт GitHub Pages)
    const url = site.url.replace(/\/?$/, '/') + pathname.replace(/^\/|\/$/g, '') + (pathname.length > 1 ? '/' : '');
    setMeta('meta[name="description"]', 'content', description, () => Object.assign(document.createElement('meta'), { name: 'description' }));
    setMeta('link[rel="canonical"]', 'href', url, () => Object.assign(document.createElement('link'), { rel: 'canonical' }));
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex' : 'index, follow', () => Object.assign(document.createElement('meta'), { name: 'robots' }));
    for (const [p, v] of [['og:title', full], ['og:description', description], ['og:url', url]]) {
      setMeta(`meta[property="${p}"]`, 'content', v, () => { const m = document.createElement('meta'); m.setAttribute('property', p); return m; });
    }
  }, [title, description, noindex, pathname]);
  return null;
}
