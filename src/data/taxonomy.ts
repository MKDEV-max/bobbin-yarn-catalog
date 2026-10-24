/*
 * Справочники каталога. Это структура навигации, а не утверждение о наличии товара:
 * на сайте показываются только значения, у которых есть позиции в каталоге.
 * Позиции привязываются к категориям в scripts/import-xlsx.mjs (по составу из заголовка таблицы).
 */

export type Option = { id: string; label: string };

/** По составу */
export const COMPOSITIONS: Option[] = [
  { id: 'natural-wool', label: '100% натуральная шерсть' },
  { id: 'merino', label: 'Мериносовая шерсть' },
  { id: 'sheep-wool', label: 'Овечья шерсть' },
  { id: 'alpaca', label: 'Альпака' },
  { id: 'mohair', label: 'Мохер' },
  { id: 'cashmere', label: 'Кашемир' },
  { id: 'angora', label: 'Ангора' },
  { id: 'camel', label: 'Верблюжья шерсть' },
  { id: 'wool-acrylic', label: 'Шерсть с акрилом' },
  { id: 'half-wool', label: 'Полушерсть' },
  { id: 'wool-polyamide', label: 'Шерсть с полиамидом' },
  { id: 'wool-polyester', label: 'Шерсть с полиэстером' },
  { id: 'wool-viscose', label: 'Шерсть с вискозой' },
  { id: 'wool-silk', label: 'Шерсть с шёлком' },
  { id: 'cotton', label: 'Хлопковая пряжа' },
  { id: 'mercerized-cotton', label: 'Мерсеризованный хлопок' },
  { id: 'viscose', label: 'Вискозная пряжа' },
  { id: 'acrylic', label: 'Акриловая пряжа' },
  { id: 'polyamide', label: 'Полиамидная пряжа' },
  { id: 'polyester', label: 'Полиэстеровая пряжа' },
  { id: 'blend', label: 'Смесовая пряжа' },
  { id: 'fancy', label: 'Фантазийная пряжа' },
];

/** По типу нити и фактуре (yarnType из карты расцветок: solid / melange / mouline) */
export const YARN_TYPES: Option[] = [
  { id: 'solid', label: 'Однотонная (гладкокрашеная)' },
  { id: 'melange', label: 'Меланжевая' },
  { id: 'mouline', label: 'Мулинированная (из нитей разных цветов)' },
  { id: 'smooth', label: 'Гладкая классическая' },
  { id: 'twisted', label: 'Крученая' },
  { id: 'single', label: 'Однониточная' },
  { id: 'multi-ply', label: 'Многосложная' },
  { id: 'high-twist', label: 'С выраженной круткой' },
  { id: 'boucle', label: 'Буклированная' },
  { id: 'fancy', label: 'Фасонная' },
  { id: 'fluffy', label: 'Пушистая' },
  { id: 'brushed', label: 'С ворсом' },
  { id: 'tweed', label: 'С эффектом твида' },
  { id: 'decorative', label: 'Эффектная декоративная' },
  { id: 'fine', label: 'Тонкая — для лёгкого трикотажа' },
  { id: 'medium', label: 'Средняя по толщине' },
  { id: 'chunky', label: 'Толстая' },
  { id: 'sock', label: 'Для носков и прочных изделий' },
  { id: 'blanket', label: 'Для пледов и домашнего текстиля' },
  { id: 'weaving', label: 'Для ткачества' },
];

/** По назначению */
export const PURPOSES: Option[] = [
  { id: 'machine', label: 'Машинное вязание' },
  { id: 'hand', label: 'Ручное вязание' },
  { id: 'sweaters', label: 'Свитера и кардиганы' },
  { id: 'hats', label: 'Шапки и шарфы' },
  { id: 'socks', label: 'Носки' },
  { id: 'kids', label: 'Детский трикотаж' },
  { id: 'summer', label: 'Летние изделия' },
  { id: 'demi', label: 'Демисезонные изделия' },
  { id: 'winter', label: 'Зимние изделия' },
  { id: 'blankets', label: 'Пледы и покрывала' },
  { id: 'home', label: 'Домашний текстиль' },
  { id: 'weaving', label: 'Ткачество' },
  { id: 'knit-fabric', label: 'Производство трикотажного полотна' },
  { id: 'small-batch', label: 'Мелкосерийное производство' },
  { id: 'wholesale', label: 'Оптовые закупки для фабрик и мастерских' },
];

/** Группы оттенков — навигация по палитре. Цвета групп берутся из реальной палитры (см. catalog.ts). */
export const COLOR_GROUPS: Option[] = [
  { id: 'white', label: 'Белые и молочные' },
  { id: 'cream', label: 'Кремовые и бежевые' },
  { id: 'sand', label: 'Песочные и карамельные' },
  { id: 'yellow', label: 'Жёлтые и золотистые' },
  { id: 'orange', label: 'Оранжевые и терракотовые' },
  { id: 'red', label: 'Красные и бордовые' },
  { id: 'pink', label: 'Розовые и пудровые' },
  { id: 'violet', label: 'Сиреневые и фиолетовые' },
  { id: 'blue', label: 'Синие и голубые' },
  { id: 'turquoise', label: 'Бирюзовые и морские' },
  { id: 'green', label: 'Зелёные и оливковые' },
  { id: 'brown', label: 'Коричневые и шоколадные' },
  { id: 'grey', label: 'Серые и графитовые' },
  { id: 'black', label: 'Чёрные' },
  { id: 'melange', label: 'Меланжевые' },
  { id: 'multi', label: 'Многоцветные и ассорти' },
  { id: 'natural', label: 'Натуральные неокрашенные' },
];

export const labelOf = (list: Option[], id: string) => list.find((o) => o.id === id)?.label ?? id;
