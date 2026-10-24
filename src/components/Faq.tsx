import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Аккордеон: открыт один вопрос; кнопки с aria-expanded/aria-controls, стрелки ↑↓ между вопросами */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  return (
    <div className="faq">
      {items.map((it, i) => {
        const id = `${uid}-${i}`, isOpen = open === i;
        return (
          <div className="faq-item" key={i}>
            <h3>
              <button type="button" id={`${id}-b`} aria-expanded={isOpen} aria-controls={`${id}-p`} onClick={() => setOpen(isOpen ? null : i)}
                onKeyDown={(e) => {
                  const n = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
                  if (n === undefined) return;
                  e.preventDefault();
                  document.getElementById(`${uid}-${(n + items.length) % items.length}-b`)?.focus();
                }}>
                <span>{it.q}</span><ChevronDown aria-hidden="true" />
              </button>
            </h3>
            <div id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} className={`faq-panel${isOpen ? ' is-open' : ''}`}>
              <div><p>{it.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
