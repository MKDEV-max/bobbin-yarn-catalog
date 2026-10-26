/*
 * Избранное (цвета) и список заявки (конкретные конфигурации). Хранятся в браузере посетителя (localStorage);
 * при недоступном хранилище работают до перезагрузки страницы.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { catalogById } from '../data/catalog';
import { COMPOSITION_OPTIONS, TWISTS, requestKey, validateCustom, type CompId, type Twist } from '../data/variants';

export type Unit = 'kg' | 'bobbins';
/** Позиция заявки — одна конфигурация: цвет + скрутка + состав (+ проценты для индивидуального) */
export type RequestItem = { key: string; colorId: string; twist: Twist; comp: CompId; wool: number | null; pan: number | null; qty: string; unit: Unit; comment: string };
export type ConfigInput = { colorId: string; twist: Twist; comp: CompId; wool?: number | null; pan?: number | null };


type Store = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  request: RequestItem[];
  inRequest: (key: string) => boolean;
  countForColor: (colorId: string) => number;
  addToRequest: (cfg: ConfigInput) => 'added' | 'exists' | 'invalid';
  updateItem: (key: string, patch: Partial<Pick<RequestItem, 'qty' | 'unit' | 'comment'>>) => void;
  removeFromRequest: (key: string) => void;
  clearRequest: () => void;
};

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватный режим — без сохранения */ }
}
/** Проверка сохранённой позиции: устаревшие (из прежней модели) и повреждённые записи отбрасываются */
function validItem(i: Partial<RequestItem>): i is RequestItem {
  return !!i && typeof i.key === 'string' && !!i.colorId && catalogById.has(i.colorId)
    && TWISTS.includes(i.twist as Twist) && COMPOSITION_OPTIONS.some((c) => c.id === i.comp)
    && (i.comp !== 'custom' || !validateCustom(String(i.wool ?? ''), String(i.pan ?? '')));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => load<string[]>('ks-fav', []).filter((id) => catalogById.has(id)));
  const [request, setRequest] = useState<RequestItem[]>(() => load<Partial<RequestItem>[]>('ks-request', []).filter(validItem));
  useEffect(() => save('ks-fav', favorites), [favorites]);
  useEffect(() => save('ks-request', request), [request]);

  const toggleFavorite = useCallback((id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []);
  const addToRequest = useCallback((cfg: ConfigInput): 'added' | 'exists' | 'invalid' => {
    if (!catalogById.has(cfg.colorId) || !TWISTS.includes(cfg.twist) || !COMPOSITION_OPTIONS.some((c) => c.id === cfg.comp)) return 'invalid';
    if (cfg.comp === 'custom' && validateCustom(String(cfg.wool ?? ''), String(cfg.pan ?? ''))) return 'invalid';
    const item: RequestItem = { key: requestKey(cfg), colorId: cfg.colorId, twist: cfg.twist, comp: cfg.comp,
      wool: cfg.comp === 'custom' ? Number(cfg.wool) : null, pan: cfg.comp === 'custom' ? Number(cfg.pan) : null, qty: '', unit: 'kg', comment: '' };
    if (request.some((i) => i.key === item.key)) return 'exists';
    setRequest((r) => (r.some((i) => i.key === item.key) ? r : [...r, item]));
    return 'added';
  }, [request]);
  const updateItem = useCallback((key: string, patch: Partial<Pick<RequestItem, 'qty' | 'unit' | 'comment'>>) => setRequest((r) => r.map((i) => (i.key === key ? { ...i, ...patch } : i))), []);
  const removeFromRequest = useCallback((key: string) => setRequest((r) => r.filter((i) => i.key !== key)), []);
  const clearRequest = useCallback(() => setRequest([]), []);

  const value = useMemo<Store>(() => ({
    favorites, isFavorite: (id) => favorites.includes(id), toggleFavorite,
    request, inRequest: (key) => request.some((i) => i.key === key), countForColor: (id) => request.filter((i) => i.colorId === id).length,
    addToRequest, updateItem, removeFromRequest, clearRequest,
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
