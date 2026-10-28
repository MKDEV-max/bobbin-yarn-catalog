import { capName, type CatalogColor } from '../data/catalog';
import { Bobbin } from './Bobbin';

/** Изображение товара: настоящее фото бобины, если оно есть в данных, иначе — иллюстрация в цвете пряжи */
export function BobbinImage({ c, className, titled }: { c: CatalogColor; className?: string; titled?: boolean }) {
  const name = capName(c.name.trim());
  if (c.photo) {
    return <img className={`${className ?? ''} bobbin-photo`} src={`${import.meta.env.BASE_URL}${c.photo}`} alt={`Бобина пряжи цвета «${name}»`} loading="lazy" decoding="async" />;
  }
  return <Bobbin hex={c.hex} tones={c.tones} type={c.type} className={className}
    title={titled ? (c.status === 'unverified' ? `Иллюстрация бобины: цвет «${name}» уточняется` : `Иллюстрация бобины в цвете «${name}»`) : undefined} />;
}
