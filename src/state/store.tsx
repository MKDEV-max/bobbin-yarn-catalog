/*
 * Избранное и список заявки. Хранятся в браузере посетителя (localStorage);
 * при недоступном хранилище работают до перезагрузки страницы.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { productById } from '../data/catalog';

export type Unit = 'kg' | 'bobbins';
export type RequestItem = { id: string; qty: string; unit: Unit; comment: string };

type Store = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  request: RequestItem[];
  inRequest: (id: string) => boolean;
  addToRequest: (ids: string | string[]) => number;
  updateItem: (id: string, patch: Partial<RequestItem>) => void;
  removeFromRequest: (id: string) => void;
  clearRequest: () => void;
};

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватный режим — без сохранения */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Убираем из сохранённого списка позиции, которых больше нет в каталоге
  const [favorites, setFavorites] = useState<string[]>(() => load<string[]>('by-fav', []).filter((id) => productById.has(id)));
  const [request, setRequest] = useState<RequestItem[]>(() => load<RequestItem[]>('by-request', []).filter((i) => productById.has(i.id)));
  useEffect(() => save('by-fav', favorites), [favorites]);
  useEffect(() => save('by-request', request), [request]);

  const toggleFavorite = useCallback((id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []);
  const addToRequest = useCallback((ids: string | string[]) => {
    const list = (Array.isArray(ids) ? ids : [ids]).filter((id) => productById.has(id));
    let added = 0;
    setRequest((r) => {
      const next = [...r];
      for (const id of list) if (!next.some((i) => i.id === id)) { next.push({ id, qty: '', unit: 'kg', comment: '' }); added++; }
      return next;
    });
    return added || list.length;
  }, []);
  const updateItem = useCallback((id: string, patch: Partial<RequestItem>) => setRequest((r) => r.map((i) => (i.id === id ? { ...i, ...patch } : i))), []);
  const removeFromRequest = useCallback((id: string) => setRequest((r) => r.filter((i) => i.id !== id)), []);
  const clearRequest = useCallback(() => setRequest([]), []);

  const value = useMemo<Store>(() => ({
    favorites, isFavorite: (id) => favorites.includes(id), toggleFavorite,
    request, inRequest: (id) => request.some((i) => i.id === id), addToRequest, updateItem, removeFromRequest, clearRequest,
  }), [favorites, request, toggleFavorite, addToRequest, updateItem, removeFromRequest, clearRequest]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore вне StoreProvider');
  return v;
}

/* ---------- Уведомления ---------- */
type ToastCtx = { show: (msg: string) => void };
const TCtx = createContext<ToastCtx>({ show: () => {} });
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('');
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(''), 3200); return () => clearTimeout(t); }, [msg]);
  return (
    <TCtx.Provider value={{ show: setMsg }}>
      {children}
      <div className="toast" role="status" aria-live="polite" hidden={!msg}>{msg}</div>
    </TCtx.Provider>
  );
}
export const useToast = () => useContext(TCtx);
