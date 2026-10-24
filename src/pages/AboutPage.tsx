/*
 * «О производстве» — тексты, порядок блоков и иконки перенесены без изменений со страницы
 * about.html сайта компании «Кавказская шерсть» (kavkazskaya-sherst).
 * Фото этапов подставляются из site.productionPhotos, когда владелец их добавит.
 */
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { site } from '../config/site';
import { PageHead } from './PageHead';

const ICON: Record<string, string> = {
  sorting: 'M4 6h16 M7 12h10 M10 18h4',
  washing: 'M12 3c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0C7 9.5 9 7 12 3z M9.5 13a2.5 2.5 0 0 0 2.5 2.5',
  combing: 'M3 8h18v4H3z M5 12v7 M8 12v7 M11 12v7 M14 12v7 M17 12v7 M20 12v7',
  spinning: 'M8 3h8l2 18H6z M7.4 8h9.2 M6.9 13h10.2 M6.4 18h11.2',
  control: 'M9 3h6 M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3 M7 15h10',
  shipping: 'M2 6h12v10H2z M14 10h4l3 3v3h-7 M6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
};

const STAGES = [
  { id: 'sorting', title: 'Сортировка', text: 'Делим руно по тонине и длине волокна, удаляем загрязнённые части.', check: 'тонина, длина волокна, засорённость', you: 'однородная по качеству партия' },
  { id: 'washing', title: 'Мойка', text: 'Промышленная мойка шерсти на производстве в Дагестане.', check: 'чистота волокна, цвет, запах', you: 'мытая шерсть натурального белого цвета' },
  { id: 'combing', title: 'Гребнечесание', text: 'Выравниваем волокна в ленту и удаляем короткое волокно.', check: 'ровнота и чистота ленты', you: 'топс, готовый к прядению' },
  { id: 'spinning', title: 'Прядение', text: 'Прядём и скручиваем нить, мотаем на бобины или в пасмы.', check: 'номер нити, крутка', you: 'пряжа под ваше оборудование' },
  { id: 'control', title: 'Контроль', text: 'Лабораторный контроль тонины и сорности шерсти, параметров нити.', check: 'тонина, сорность, параметры нити', you: 'характеристики партии известны до отгрузки' },
  { id: 'shipping', title: 'Отгрузка', text: 'Упаковываем в мешки или коробки и отгружаем удобным способом.', check: 'вес и маркировка мест', you: 'партия по всей России: ТК, авто, ж/д' },
] as const;

const CLIENTS = [
  ['Текстильные фабрики', 'Мытая шерсть и топс для прядения, пряжа на бобинах для ткачества.'],
  ['Трикотажные производства', 'Пряжа на бобинах для машинной вязки, носочное производство.'],
  ['Ковровые производства', 'Крученая пряжа и пряжа в пасмах для ковроткачества.'],
  ['Мастерские и оптовики', 'Шерсть для валяния и войлока, пряжа в пасмах.'],
];

export function AboutPage() {
  const photos = site.productionPhotos;
  return (
    <>
      <Seo title="О производстве: переработка шерсти дагестанского мериноса"
        description="Производство мытой шерсти, топса и шерстяной пряжи в Республике Дагестан: сортировка, мойка, гребнечесание, прядение, контроль и отгрузка. Сырьё — шерсть дагестанского мериноса." />
      <PageHead title="Производство шерсти и пряжи в Дагестане" crumb="О производстве"
        lead="Перерабатываем шерсть дагестанского мериноса полным циклом: от сортировки руна до пряжи на бобинах и в пасмах." />

      <section className="section" aria-labelledby="who-title">
        <div className="container grid-2">
          <div className="section-head" style={{ margin: 0 }}>
            <p className="eyebrow">Кто мы</p>
            <h2 id="who-title">Производитель, а не посредник</h2>
            <p>«{site.name}» перерабатывает шерсть и поставляет её напрямую производствам — без перекупщиков. Работаем с одним сырьём: шерстью дагестанского мериноса.</p>
          </div>
          <dl className="specs specs-lg">
            <dt>Производство</dt><dd>{site.region}</dd>
            {site.contacts.address && <><dt>Адрес</dt><dd>{site.contacts.address}</dd></>}
            <dt>Сырьё</dt><dd>Шерсть дагестанского мериноса с отар высокогорных и предгорных районов Дагестана</dd>
            <dt>Продукция</dt><dd>Мытая шерсть, топс, шерстяная пряжа</dd>
            <dt>Поставки</dt><dd>По всей России, от мешка до вагонных норм</dd>
          </dl>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="stages-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Что происходит с сырьём</p>
            <h2 id="stages-title">Шесть этапов переработки</h2>
            <p>Моем шерсть там же, где её стригут, — поэтому волокно не сваливается и не желтеет при долгой перевозке немытого руна.</p>
          </div>
          <ol className="timeline">
            {STAGES.map((s, i) => (
              <li className="stage" key={s.id}>
                <div className="stage-media">
                  <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
                  {photos[s.id]
                    ? <img src={`${import.meta.env.BASE_URL}${photos[s.id]!.src}`} alt={photos[s.id]!.alt} loading="lazy" decoding="async" />
                    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICON[s.id]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div className="stage-body">
                  <h3>{s.title}</h3><p>{s.text}</p>
                  <dl className="specs"><dt>Контроль</dt><dd>{s.check}</dd><dt>Для вас</dt><dd>{s.you}</dd></dl>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="quality-title">
        <div className="container grid-2">
          <div className="section-head" style={{ margin: 0 }}>
            <p className="eyebrow">Качество</p>
            <h2 id="quality-title">Как проверить качество до заказа</h2>
            <p>Лучший способ убедиться, что сырьё или пряжа подходят вашему производству, — проверить образец на своём оборудовании.</p>
          </div>
          <ul className="checks checks-lg">
            <li>Отправим образец шерсти, топса или пряжи до заказа партии.</li>
            <li>Сообщим тонину и сорность партии по данным лабораторного контроля.</li>
            <li>Для пряжи согласуем номер нити, число сложений и крутку.</li>
            <li>Ответим, какие документы можем предоставить по вашей партии.</li>
          </ul>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="clients-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Для кого</p>
            <h2 id="clients-title">Кому мы поставляем</h2>
          </div>
          <div className="grid-4">
            {CLIENTS.map(([t, d]) => <article className="client-card" key={t}><h3>{t}</h3><p>{d}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="docs-title" id="documents">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Документы</p>
            <h2 id="docs-title">Документы и контроль качества</h2>
          </div>
          <div className="empty-note">
            <p>Укажите в заявке, какие документы требуются вашему производству, — менеджер ответит, что можем предоставить по вашей партии.</p>
            <Link className="btn btn-primary" to="/wholesale">Запросить КП и документы</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Запрос образца">
        <div className="container">
          <div className="cta-band on-dark">
            <div>
              <h2>Проверьте сырьё на своём оборудовании</h2>
              <p>Пришлём образец шерсти, топса или пряжи до заказа партии.</p>
            </div>
            <div className="actions">
              <Link className="btn btn-sand" to="/request">Запросить образец</Link>
              <Link className="btn btn-outline" to="/catalog">Смотреть каталог</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
