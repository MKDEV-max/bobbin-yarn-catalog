import type { ReactNode } from 'react';
import { PageHero } from '../components/Brand';

/** Шапка внутренней страницы: тёмный блок с силуэтом гор, хлебные крошки, H1, вводный абзац */
export function PageHead({ title, crumb, lead, parent, children }: { title: string; crumb?: string; lead?: ReactNode; parent?: { to: string; label: string }; children?: ReactNode }) {
  return <PageHero crumbs={[...(parent ? [parent] : []), { label: crumb ?? title }]} title={title} lead={lead}>{children}</PageHero>;
}
