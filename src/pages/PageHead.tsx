import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Шапка внутренней страницы: хлебные крошки, H1, вводный абзац */
export function PageHead({ title, crumb, lead }: { title: string; crumb?: string; lead?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/">Главная</Link></li><li aria-current="page">{crumb ?? title}</li></ol></nav>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </div>
  );
}
