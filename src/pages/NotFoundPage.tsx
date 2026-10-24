import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Страница не найдена" description="Такой страницы нет. Перейдите в каталог бобинной пряжи или на главную." noindex />
      <section className="section">
        <div className="container empty-state not-found">
          <p className="eyebrow">Ошибка 404</p>
          <h1>Страница не найдена</h1>
          <p>Возможно, ссылка устарела или позиция убрана из каталога.</p>
          <div className="actions"><Link className="btn btn-primary" to="/catalog">Перейти в каталог</Link><Link className="btn btn-outline" to="/">На главную</Link></div>
        </div>
      </section>
    </>
  );
}
