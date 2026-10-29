import { personDisplayTitle, personInitials, type Locale, type LocalizedText, type Person } from '@msc-web/content';
import { MediaImage, fallbackLang, txt } from '../components/common';
import { COMMON, t } from '../i18n/strings';
import { personPath, sitePath } from '../routing/paths';

/**
 * Entries sit directly under a page h1 (level 2), under a group or department h2 (level 3), or under a department
 * h3 on the page that lists everyone (level 4).
 * 条目直接位于页面 h1 之下（第 2 级）、团体或部门 h2 之下（第 3 级），或位于列出所有人的页面中的部门 h3 之下（第 4 级）。
 */
export type CardHeadingLevel = 2 | 3 | 4;

/**
 * How an entry sits in its group, from the most room to the least: a portrait with the photo above the name (Honorary
 * Advisors), an office seat that names its office and has a small photo beside the name (Presidium), and a compact
 * row with a thumbnail beside the role and name (Department Leads).
 * 条目在团体中的排布方式，所占空间从大到小：照片在姓名上方的肖像（荣誉顾问）、写明职位且小照片在姓名旁的职位席（主席团），
 * 以及缩略图在职务与姓名旁的紧凑行（部长团）。
 */
export type PersonLayout = 'portrait' | 'seat' | 'row';

function headingTag(level: CardHeadingLevel): 'h2' | 'h3' | 'h4' {
  return level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
}

/**
 * One person in a list, in English only like all of Our People: photo or monogram, name, title and, outside a compact
 * row, affiliation. The title is the person's display title unless the list gives a shorter one, such as "Head" inside
 * a Department's own block. The name is the heading and links to the person's own page, which has the bio and contact
 * links; the link stretches over the whole entry. The photo has an empty alt because the name follows it. The name
 * comes first in the markup, so moving by headings reads the title right after it; the stylesheet places the title
 * where each layout shows it.
 * 列表中的一位成员，与 "我们的团队" 的其他内容一样只显示英文：照片或姓名首字、姓名、头衔，紧凑行以外还有专业或单位。
 * 头衔为该成员的显示头衔，除非列表给出更短的写法，例如部门区块内的 "Head"。姓名是标题，链接到该成员的个人页面（简介与联系方式在那里），
 * 链接覆盖整个条目。照片的 alt 为空，因为紧接着就是姓名。姓名在标记中排在最前，按标题跳转时紧接着读到头衔；头衔在各排布中的位置由样式表决定。
 */
export function PersonCard(props: { person: Person; locale: Locale; layout: PersonLayout; headingLevel?: CardHeadingLevel; title?: LocalizedText }) {
  const { person, locale, layout } = props;
  const Heading = headingTag(props.headingLevel ?? 3);
  const name = txt(person.name, locale);
  const title = props.title ?? personDisplayTitle(person);
  const affiliation = layout === 'row' ? '' : txt(person.affiliation, locale);

  return (
    <li class={`person person--${layout} person--link`}>
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
 * An office nobody holds yet: "to be announced" with the office title (or a shorter label, such as "Head" inside a
 * Department's own block) and, for a seat, what the office does. It draws no empty photo frame: a seat is a quiet
 * filled slot and a row is a plain pair of lines. The heading names the full office for screen readers, so vacancies
 * do not read as identical headings; the visible title line is hidden from them to avoid reading the office twice.
 * 尚无人担任的职位：写明 "待公布" 与职位名称（或更短的写法，例如部门区块内的 "Head"），职位席还写明该职位的职责。不画空白照片框：
 * 职位席是一个安静的色块，紧凑行只是两行文字。标题为读屏软件写明完整职位，空缺因此不会读成一串相同的标题；
 * 可见的职位行对读屏软件隐藏，以免职位被读两遍。
 */
export function VacantPersonCard(props: {
  title: string;
  label?: string;
  duties?: string;
  locale: Locale;
  layout: Exclude<PersonLayout, 'portrait'>;
  headingLevel?: CardHeadingLevel;
}) {
  const Heading = headingTag(props.headingLevel ?? 3);
  return (
    <li class={`person person--${props.layout} person--vacant`}>
      <Heading class="person__name">
        <span class="sr-only">{props.locale === 'zh' ? `${props.title}：` : `${props.title}: `}</span>
        {t(COMMON, 'toBeAnnounced', props.locale)}
      </Heading>
      <p class="person__title" aria-hidden="true">
        {props.label ?? props.title}
      </p>
      {props.duties && <p class="person__duties">{props.duties}</p>}
    </li>
  );
}
