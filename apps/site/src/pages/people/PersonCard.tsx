import { personDisplayTitle, personInitials, type Locale, type Person } from '@msc-web/content';
import { MediaImage, fallbackLang, txt } from '../components/common';
import { COMMON, t } from '../i18n/strings';
import { personPath, sitePath } from '../routing/paths';

/**
 * Names sit directly under the page h1 on a group's own page (level 2), or under a group's h2 on /people and on the
 * home page (level 3).
 * 姓名在团体自己的页面上直接位于页面 h1 之下（第 2 级），在 /people 与首页上位于团体的 h2 之下（第 3 级）。
 */
export type CardHeadingLevel = 2 | 3;

/**
 * One person as a tile, the same everywhere people are listed and in English only like all of Our People: a 4:5 photo
 * or monogram over a purple bar, then the name, the title and the affiliation. The title is the person's display
 * title: an office such as "President" or "Head of Technology", or a title of their own. The name is the heading and
 * links to the person's own page, which has the bio and contact links; the link stretches over the whole tile. The
 * photo has an empty alt because the name follows it. The name comes first after the photo, so moving by headings
 * reads the title right after it.
 * 一位成员的方块，各处列出成员时都相同，并与 "我们的团队" 的其他内容一样只显示英文：4:5 的照片或姓名首字及其下方的紫色细条，
 * 然后是姓名、头衔与专业或单位。头衔为该成员的显示头衔：职位名称（例如 "President" 或 "Head of Technology"），或其自定义头衔。
 * 姓名是标题，链接到该成员的个人页面（简介与联系方式在那里），链接覆盖整个方块。照片的 alt 为空，因为紧接着就是姓名。
 * 照片之后最先出现的是姓名，按标题跳转时紧接着读到头衔。
 */
export function PersonCard(props: { person: Person; locale: Locale; headingLevel: CardHeadingLevel }) {
  const { person, locale } = props;
  const Heading = props.headingLevel === 2 ? 'h2' : 'h3';
  const name = txt(person.name, locale);
  const title = personDisplayTitle(person);
  const affiliation = txt(person.affiliation, locale);

  return (
    <li class="person">
      {person.photoKey ? (
        <MediaImage class="person__photo" mediaKey={person.photoKey} alt="" />
      ) : (
        <div class="person__monogram" aria-hidden="true">
          {personInitials(name)}
        </div>
      )}
      <Heading class="person__name" lang={fallbackLang(person.name, locale)}>
        <a class="person__link" href={sitePath(personPath(person.id))}>
          {name}
        </a>
      </Heading>
      <p class="person__title" lang={fallbackLang(title, locale)}>
        {txt(title, locale)}
      </p>
      {affiliation && (
        <p class="person__affiliation" lang={fallbackLang(person.affiliation, locale)}>
          {affiliation}
        </p>
      )}
    </li>
  );
}

/**
 * People as a centred row of tiles of one size, wrapping into even rows when there are many; nothing when the list is
 * empty. `class` adds modifiers to the list, such as the advisors' one.
 * 以同样大小的方块居中排成一行的成员，人数较多时换成整齐的几行；列表为空时不输出任何内容。`class` 为列表加上修饰类，例如荣誉顾问的修饰类。
 */
export function PersonTiles(props: { people: readonly Person[]; locale: Locale; headingLevel: CardHeadingLevel; class?: string }) {
  if (props.people.length === 0) return null;
  return (
    <ul class={props.class ? `people-grid ${props.class}` : 'people-grid'} role="list">
      {props.people.map((person) => (
        <PersonCard person={person} locale={props.locale} headingLevel={props.headingLevel} />
      ))}
    </ul>
  );
}

/**
 * The offices of a group that nobody holds yet, each as one quiet line under the group's tiles: the office, then "to be
 * announced". A vacancy is never a tile or an empty photo frame, and it is not a heading. Nothing when every office is
 * held.
 * 某一团体中尚无人担任的职位，每个职位是位于该团体方块下方的一行安静的文字：职位名称，然后是 "待公布"。空缺从不显示为方块或空白照片框，
 * 也不是标题。每个职位都有人担任时不输出任何内容。
 */
export function Vacancies(props: { offices: readonly string[]; locale: Locale }) {
  if (props.offices.length === 0) return null;
  return (
    <ul class="vacancies" role="list">
      {props.offices.map((office) => (
        <li>
          <span class="vacancies__office">{office}</span>
          <span class="sr-only">: </span>
          <span class="vacancies__status">{t(COMMON, 'toBeAnnounced', props.locale)}</span>
        </li>
      ))}
    </ul>
  );
}
