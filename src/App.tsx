import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ColorSelectionPage } from './pages/ColorSelectionPage';
import { ProductPage } from './pages/ProductPage';
import { AboutPage } from './pages/AboutPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { WholesalePage } from './pages/WholesalePage';
import { ContactsPage } from './pages/ContactsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RequestPage } from './pages/RequestPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Прокрутка наверх при смене страницы (фильтры каталога меняют только search — их не трогаем) */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <ScrollToTop />
      <Header />
      <main id="main" tabIndex={-1}><Outlet /></main>
      <Footer />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="colors" element={<ColorSelectionPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="delivery" element={<DeliveryPage />} />
        <Route path="wholesale" element={<WholesalePage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="request" element={<RequestPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
