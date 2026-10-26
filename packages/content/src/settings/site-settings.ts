import type { LocalizedText } from '../locale/locale';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import { readBoolean, readEnum, readLocalizedText, readOptionalEmail, readOptionalMediaKey, readOptionalUrl, readText } from '../validation/fields';

/**
 * Site-wide copy and contact details that officers edit in one form: the home page hero, the mission statement,
 * how to join, contact links, an optional announcement bar, and the sponsors, partners and partner clubs. Stored as one JSON document; fields missing from
 * an older stored copy take their defaults, so adding a field never needs a data migration.
 * 干部在一张表单中编辑的全站文案与联系方式：首页主视觉、宗旨、加入方式、联系链接、可选的公告栏，以及赞助商、合作商与联动社团。以一个 JSON 文档保存；
 * 旧版本保存的数据缺少的字段使用默认值，因此新增字段无需数据迁移。
 */
/** The three kinds of organization the home page lists, in the order it shows them. */
/** 首页列出的三类组织，按首页显示的顺序排列。 */
export const PARTNER_KINDS = ['sponsor', 'partner', 'club'] as const;

export type PartnerKind = (typeof PARTNER_KINDS)[number];

export const PARTNER_KIND_LABELS: Record<PartnerKind, LocalizedText> = {
  sponsor: { zh: '赞助商', en: 'Sponsors' },
  partner: { zh: '合作商', en: 'Partners' },
  club: { zh: '联动社团', en: 'Partner clubs' },
};

/**
 * A sponsor, partner or partner club. The id is made by the backend when the entry is added and never changes, so a
 * logo upload that finishes after the list was reordered still lands on the right entry.
 * 一个赞助商、合作商或联动社团。编号在后台添加条目时生成且不会改变，因此在列表重新排序之后才完成的 Logo 上传仍会落到正确的条目上。
 */
export interface Partner {
  id: string;
  kind: PartnerKind;
  name: LocalizedText;
  logoKey: string | null;
  /** The organization's own site; empty for none. */
  /** 该组织自己的网站；留空表示没有。 */
  url: string;
}

export interface SiteSettings {
  hero: {
    tagline: LocalizedText;
    intro: LocalizedText;
    /** Null uses the photo that ships with the site. */
    /** 为空时使用网站自带的照片。 */
    imageKey: string | null;
  };
  about: {
    mission: LocalizedText;
  };
  join: {
    text: LocalizedText;
    /** Where "Join us" goes; a site path such as /UTMMSC/ or a full address. */
    /** "加入我们" 的去向；本站路径（如 /UTMMSC/）或完整网址。 */
    url: string;
  };
  contact: {
    email: string;
    wechatId: string;
    wechatQrKey: string | null;
    instagramUrl: string;
    xiaohongshuUrl: string;
    linkedinUrl: string;
    githubUrl: string;
  };
  announcement: {
    enabled: boolean;
    text: LocalizedText;
    url: string;
  };
  partners: {
    /** In the order the home page shows them within each kind. */
    /** 首页在每一类中按此顺序显示。 */
    items: Partner[];
  };
}

export const SETTINGS_LIMITS = {
  tagline: 120,
  intro: 600,
  mission: 3000,
  joinText: 600,
  announcement: 200,
  wechatId: 60,
  partnerName: 80,
  partners: 60,
} as const;

/** Defaults drawn from Articles 2 and 3 of the constitution, so a fresh site already says the right things. */
/** 默认文案取自章程第 2 条与第 3 条，全新的网站也能准确介绍联盟。 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero: {
    tagline: {
      zh: '用中文相聚，一起学习，一起走进加拿大校园。',
      en: 'A home for Mandarin speakers and learners at UTM, built around learning together.',
    },
    intro: {
      zh: '国语学者联盟（UTMMSC）是多伦多大学密西沙加校区的学生社团。我们组织考前复习、学术讲座与课外活动，帮助中文使用者适应校园、融入本地社会，也欢迎每一位想学习中文、参与跨文化交流的同学。',
      en: 'The Mandarin Scholars Coalition (UTMMSC) is a student group at the University of Toronto Mississauga. We run test reviews, academic talks and extracurricular events that help Mandarin-speaking students settle into campus life and engage with Canadian society, and we welcome every student who wants to learn Mandarin or take part in cross-cultural exchange.',
    },
    imageKey: null,
  },
  about: {
    mission: {
      zh: [
        'UTMMSC 致力于丰富多伦多大学的学业、娱乐、社交与文化生活。',
        '我们帮助中文使用者适应校园生活、积极融入加拿大本地社会，而不是只在同乡圈子里社交；欢迎本地学生与国际学生等不同背景的同学学习中文、参与跨文化交流；在课外科研与学术写作方面提供同伴指导，为未来的学术道路做准备；并组织以兴趣为主题的活动、项目与社区参与机会。',
        '我们严格维护学术诚信：禁止代写、禁止替他人完成计分作业，也不与任何违反《学术行为守则》的机构合作。',
      ].join('\n\n'),
      en: [
        'UTMMSC contributes to the educational, recreational, social and cultural life of the University.',
        'We support Mandarin-speaking students in adapting to campus life and engaging with local Canadian society, with an outward orientation rather than an inward co-national circle; we welcome students of all backgrounds, local and international, who wish to learn Mandarin and take part in cross-cultural exchange; we offer peer mentorship in extracurricular research and scholarly writing to prepare members for future academic pathways; and we organize interest-based events, projects and community engagement.',
        'We strictly uphold academic integrity. We prohibit ghostwriting and completing graded work for others, and we do not partner with anyone who violates the Code of Behaviour on Academic Matters.',
      ].join('\n\n'),
    },
  },
  join: {
    text: {
      zh: '成员资格向所有多伦多大学注册学生开放，不收会费。使用多伦多大学邮箱在成员网络注册即可加入。',
      en: 'Membership is open to every registered University of Toronto student and there is no fee. Register on the member network with your U of T email to join.',
    },
    url: '/UTMMSC/',
  },
  contact: {
    email: '',
    wechatId: '',
    wechatQrKey: null,
    instagramUrl: '',
    xiaohongshuUrl: '',
    linkedinUrl: '',
    githubUrl: '',
  },
  announcement: {
    enabled: false,
    text: { zh: '', en: '' },
    url: '',
  },
  partners: {
    items: [],
  },
};

const PARTNER_ID = /^[A-Za-z0-9_-]{1,40}$/;

function readPartners(issues: IssueCollector, value: unknown): Partner[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    issues.add('partners.items', '赞助与合作名单格式不正确');
    return [];
  }
  if (value.length > SETTINGS_LIMITS.partners) issues.add('partners.items', `最多添加 ${SETTINGS_LIMITS.partners} 个赞助商、合作商与联动社团`);
  const seen = new Set<string>();
  return value.slice(0, SETTINGS_LIMITS.partners).map((raw, index): Partner => {
    const item = asRecord(raw);
    const field = `partners.items.${index}`;
    const id = typeof item.id === 'string' && PARTNER_ID.test(item.id) && !seen.has(item.id) ? item.id : '';
    if (id) seen.add(id);
    else issues.add(`${field}.id`, '条目编号无效，请刷新页面后重试');
    return {
      id,
      kind: readEnum(issues, item.kind, `${field}.kind`, PARTNER_KINDS, '类别'),
      name: readLocalizedText(issues, item.name, `${field}.name`, { label: '名称', max: SETTINGS_LIMITS.partnerName, required: true }),
      logoKey: readOptionalMediaKey(issues, item.logoKey, `${field}.logoKey`, 'image', 'Logo'),
      url: readOptionalUrl(issues, item.url, `${field}.url`, { label: '网站链接' }) ?? '',
    };
  });
}

export function validateSiteSettings(raw: unknown): ValidationResult<SiteSettings> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const hero = asRecord(body.hero);
  const about = asRecord(body.about);
  const join = asRecord(body.join);
  const contact = asRecord(body.contact);
  const announcement = asRecord(body.announcement);
  const partners = asRecord(body.partners);

  const value: SiteSettings = {
    hero: {
      tagline: readLocalizedText(issues, hero.tagline, 'hero.tagline', { label: '标语', max: SETTINGS_LIMITS.tagline, required: true }),
      intro: readLocalizedText(issues, hero.intro, 'hero.intro', { label: '首页介绍', max: SETTINGS_LIMITS.intro, required: true, multiline: true }),
      imageKey: readOptionalMediaKey(issues, hero.imageKey, 'hero.imageKey', 'image', '首页图片'),
    },
    about: {
      mission: readLocalizedText(issues, about.mission, 'about.mission', { label: '宗旨', max: SETTINGS_LIMITS.mission, required: true, multiline: true }),
    },
    join: {
      text: readLocalizedText(issues, join.text, 'join.text', { label: '加入说明', max: SETTINGS_LIMITS.joinText, required: true, multiline: true }),
      url: readOptionalUrl(issues, join.url, 'join.url', { label: '加入链接', allowSitePath: true }) ?? DEFAULT_SITE_SETTINGS.join.url,
    },
    contact: {
      email: readOptionalEmail(issues, contact.email, 'contact.email', '联系邮箱') ?? '',
      wechatId: readText(issues, contact.wechatId, 'contact.wechatId', { label: '微信号', max: SETTINGS_LIMITS.wechatId }),
      wechatQrKey: readOptionalMediaKey(issues, contact.wechatQrKey, 'contact.wechatQrKey', 'image', '微信二维码'),
      instagramUrl: readOptionalUrl(issues, contact.instagramUrl, 'contact.instagramUrl', { label: 'Instagram 链接' }) ?? '',
      xiaohongshuUrl: readOptionalUrl(issues, contact.xiaohongshuUrl, 'contact.xiaohongshuUrl', { label: '小红书链接' }) ?? '',
      linkedinUrl: readOptionalUrl(issues, contact.linkedinUrl, 'contact.linkedinUrl', { label: 'LinkedIn 链接' }) ?? '',
      githubUrl: readOptionalUrl(issues, contact.githubUrl, 'contact.githubUrl', { label: 'GitHub 链接' }) ?? '',
    },
    announcement: {
      enabled: readBoolean(issues, announcement.enabled, 'announcement.enabled', '公告开关', false),
      text: readLocalizedText(issues, announcement.text, 'announcement.text', { label: '公告内容', max: SETTINGS_LIMITS.announcement }),
      url: readOptionalUrl(issues, announcement.url, 'announcement.url', { label: '公告链接', allowSitePath: true }) ?? '',
    },
    partners: {
      items: readPartners(issues, partners.items),
    },
  };
  if (value.announcement.enabled && !value.announcement.text.zh && !value.announcement.text.en) {
    issues.add('announcement.text.zh', '开启公告前请填写公告内容');
  }
  return issues.result(value);
}

function mergeInto<T>(defaults: T, stored: unknown): T {
  if (Array.isArray(defaults)) return (Array.isArray(stored) ? stored : defaults) as T;
  if (typeof defaults !== 'object' || defaults === null) {
    if (defaults === null) return (typeof stored === 'string' ? stored : null) as T;
    return (typeof stored === typeof defaults ? stored : defaults) as T;
  }
  const source = asRecord(stored);
  const result: Record<string, unknown> = {};
  for (const [key, fallback] of Object.entries(defaults as Record<string, unknown>)) {
    result[key] = key in source ? mergeInto(fallback, source[key]) : fallback;
  }
  return result as T;
}

/**
 * Settings as stored, laid over the defaults field by field. Stored values were validated when saved, so only the
 * shape is checked here: a field of the wrong type, or one added after the copy was stored, takes its default. A list
 * is kept as stored when it is a list at all.
 * 将已保存的设置逐字段覆盖到默认值上。保存时已经校验过，因此这里只检查结构：类型不符的字段，或在保存之后才新增的字段，使用默认值。
 * 列表只要确实是列表，就按保存时的内容保留。
 */
export function readStoredSettings(json: string | null): SiteSettings {
  if (!json) return DEFAULT_SITE_SETTINGS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
  return mergeInto(DEFAULT_SITE_SETTINGS, parsed);
}

/** Media keys a settings document refers to, so the uploads it uses are never cleaned up. */
/** 设置文档引用的媒体键，确保其使用的上传文件不会被清理。 */
export function settingsMediaKeys(settings: SiteSettings): string[] {
  return [settings.hero.imageKey, settings.contact.wechatQrKey, ...settings.partners.items.map((partner) => partner.logoKey)].filter((key): key is string =>
    Boolean(key),
  );
}
