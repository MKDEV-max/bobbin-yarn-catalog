/*
 * Все изображения сайта, кроме образцов цветов, — в одном месте для простой замены.
 * Сейчас это иллюстрации с Unsplash (бесплатная лицензия): они показывают бобины пряжи
 * в целом и НЕ изображают конкретные товары каталога. Замените на свои фото — укажите
 * путь в public/ (например 'photos/hero.jpg') и stock: false.
 */
const u = (id: string, w: number, h: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=75`;

export type Pic = { src: string; srcSmall: string; alt: string; credit: string; stock: boolean };

export const IMAGES: Record<'hero' | 'wholesale' | 'guide', Pic> = {
  hero: {
    src: u('1746737198845-e1e74bea786e', 1600, 1000), srcSmall: u('1746737198845-e1e74bea786e', 800, 600),
    alt: 'Бобины пряжи, уложенные плотными рядами', credit: 'Фото: Caroline Badran / Unsplash', stock: true,
  },
  wholesale: {
    src: u('1636986056375-184676d8ca14', 1400, 800), srcSmall: u('1636986056375-184676d8ca14', 800, 500),
    alt: 'Ряды бобин на текстильном оборудовании', credit: 'Фото: Prince Prabhakaran / Unsplash', stock: true,
  },
  guide: {
    src: u('1575052734309-6008d800b7dc', 1200, 900), srcSmall: u('1575052734309-6008d800b7dc', 800, 600),
    alt: 'Бобины светлой пряжи крупным планом', credit: 'Фото: K15 Photos / Unsplash', stock: true,
  },
};
