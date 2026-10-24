import { Link } from 'react-router-dom';
import { ClipboardPlus } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHead } from './PageHead';
import { ProductCard } from '../components/ProductCard';
import { productById } from '../data/catalog';
import { useStore, useToast } from '../state/store';

export function FavoritesPage() {
  const { favorites, addToRequest } = useStore();
  const toast = useToast();
  const items = favorites.map((id) => productById.get(id)!).filter(Boolean);
  return (
    <>
      <Seo title="Избранное" description="Сохранённые позиции бобинной пряжи." noindex />
      <PageHead title="Избранное" crumb="Избранное" lead={<>Позиции сохраняются в этом браузере.</>} />
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          {items.length ? (
            <>
              <div className="head-row" style={{ marginBottom: 'var(--space-5)' }}>
                <p className="results-count">Сохранено: <b>{items.length}</b></p>
                <button className="btn btn-primary" type="button" onClick={() => { addToRequest(items.map((p) => p.id)); toast.show('Все позиции добавлены в заявку'); }}><ClipboardPlus aria-hidden="true" />Всё в заявку</button>
              </div>
              <div className="product-grid">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
            </>
          ) : (
            <div className="empty-state">
              <h2>Здесь пока пусто</h2>
              <p>Нажмите на сердечко в карточке товара, чтобы сохранить позицию.</p>
              <div className="actions"><Link className="btn btn-primary" to="/catalog">Перейти в каталог</Link></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
