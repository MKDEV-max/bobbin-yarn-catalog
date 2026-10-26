import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { PageHead } from './PageHead';
import { ProductCard } from '../components/ProductCard';
import { catalogById } from '../data/catalog';
import { useStore } from '../state/store';

export function FavoritesPage() {
  const { favorites } = useStore();
  const items = favorites.map((id) => catalogById.get(id)!).filter(Boolean);
  return (
    <>
      <Seo title="Избранное" description="Сохранённые цвета бобинной пряжи." noindex />
      <PageHead title="Избранное" crumb="Избранное" lead="Цвета сохраняются в этом браузере. Выберите скрутку и состав в карточке — и добавьте в заявку." />
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          {items.length ? (
            <>
              <p className="results-count" style={{ marginBottom: 'var(--space-5)' }}>Сохранено цветов: <b>{items.length}</b></p>
              <div className="product-grid">{items.map((c, i) => <ProductCard key={c.id} c={c} index={i} />)}</div>
            </>
          ) : (
            <div className="empty-state">
              <h2>Здесь пока пусто</h2>
              <p>Нажмите на сердечко в карточке цвета, чтобы сохранить его.</p>
              <div className="actions"><Link className="btn btn-primary" to="/catalog">Смотреть каталог</Link></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
