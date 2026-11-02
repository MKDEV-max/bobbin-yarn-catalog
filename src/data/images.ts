/*
 * Все изображения сайта, кроме образцов цветов, — в одном месте для простой замены.
 * Файлы лежат в public/photos (загружаются с того же хостинга, без сторонних сервисов).
 * Это иллюстрации с Unsplash (свободная лицензия): бобины пряжи в целом, НЕ конкретные товары каталога.
 * Чтобы заменить на свои фото — положите файл в public/photos и укажите его имя.
 */
const local = (file: string) => `${import.meta.env.BASE_URL}photos/${file}`;

export type Pic = { src: string; srcSmall: string; alt: string; credit: string; stock: boolean };

export const IMAGES: Record<'hero' | 'wholesale' | 'guide', Pic> = {
  hero: {
    src: local('hero.jpg'), srcSmall: local('hero.jpg'),
    alt: 'Бобины пряжи, уложенные плотными рядами', credit: 'Фото: Caroline Badran / Unsplash', stock: true,
  },
  wholesale: {
    src: local('wholesale.jpg'), srcSmall: local('wholesale.jpg'),
    alt: 'Ряды бобин на текстильном оборудовании', credit: 'Фото: Prince Prabhakaran / Unsplash', stock: true,
  },
  guide: {
    src: local('guide.jpg'), srcSmall: local('guide.jpg'),
    alt: 'Бобины светлой пряжи крупным планом', credit: 'Фото: K15 Photos / Unsplash', stock: true,
  },
};
