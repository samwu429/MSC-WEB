import type { Locale, LocalizedText } from '@msc-web/content';

/**
 * Fixed interface text of the public site in both languages. Content editors change the copy in the backend;
 * these strings are the labels and buttons around that copy. Page modules may add their own dictionaries next to
 * the page, in this same shape, for text only that page uses.
 * 公开网站固定界面文字的中英文版本。内容由编辑者在后台修改；这些字符串是内容周围的标签与按钮。
 * 页面模块可以在页面旁边以同样的结构添加仅该页面使用的词条。
 */
export const COMMON = {
  siteName: { zh: '国语学者联盟', en: 'Mandarin Scholars Coalition' },
  siteShortName: { zh: 'UTMMSC', en: 'UTMMSC' },
  campus: { zh: '多伦多大学密西沙加校区', en: 'University of Toronto Mississauga' },
  skipToContent: { zh: '跳到正文', en: 'Skip to content' },
  menu: { zh: '菜单', en: 'Menu' },
  navHome: { zh: '首页', en: 'Home' },
  navEvents: { zh: '活动', en: 'Events' },
  navReviews: { zh: '考前复习', en: 'Test Reviews' },
  navPeople: { zh: '我们的团队', en: 'Our People' },
  navAbout: { zh: '关于我们', en: 'About' },
  memberNetwork: { zh: '成员网络', en: 'Member Network' },
  joinUs: { zh: '加入我们', en: 'Join us' },
  viewAll: { zh: '查看全部', en: 'View all' },
  learnMore: { zh: '了解更多', en: 'Learn more' },
  register: { zh: '报名', en: 'Register' },
  details: { zh: '详情', en: 'Details' },
  back: { zh: '返回', en: 'Back' },
  toBeAnnounced: { zh: '待公布', en: 'To be announced' },
  timeTba: { zh: '时间待定', en: 'Time to be announced' },
  upcoming: { zh: '即将开始', en: 'Upcoming' },
  past: { zh: '已结束', en: 'Past' },
  happeningNow: { zh: '进行中', en: 'Happening now' },
  footerDisclaimer: {
    zh: 'UTMMSC 是多伦多大学密西沙加校区的学生社团，并非多伦多大学或其密西沙加校区的官方部门、项目或办公室。',
    en: 'UTMMSC is a student group at the University of Toronto Mississauga. It is not an official department, program or office of the University of Toronto or the University of Toronto Mississauga.',
  },
  footerContact: { zh: '联系我们', en: 'Contact' },
  footerExplore: { zh: '浏览', en: 'Explore' },
  footerMembers: { zh: '成员', en: 'Members' },
  adminSignIn: { zh: '干部登录', en: 'Officer sign-in' },
  androidApp: { zh: '安卓 App', en: 'Android app' },
  openMemberNetwork: { zh: '进入成员网络', en: 'Open the member network' },
  downloadAndroid: { zh: '下载安卓 App', en: 'Download the Android app' },
  wechat: { zh: '微信', en: 'WeChat' },
  email: { zh: '邮箱', en: 'Email' },
  notFoundTitle: { zh: '页面不存在', en: 'Page not found' },
  notFoundText: { zh: '你访问的页面不存在，可能已被移动或删除。', en: 'The page you are looking for does not exist. It may have been moved or removed.' },
  errorTitle: { zh: '页面出错了', en: 'Something went wrong' },
  errorText: { zh: '服务器暂时出了问题，请稍后刷新再试。', en: 'The server ran into a problem. Please try again in a moment.' },
  backHome: { zh: '回到首页', en: 'Back to home' },
} satisfies Record<string, LocalizedText>;

export type CommonKey = keyof typeof COMMON;

/** A string from a dictionary in a locale. Dictionary entries always fill both languages. */
/** 从词典中取指定语言的字符串。词典条目总是同时填写两种语言。 */
export function t<D extends Record<string, LocalizedText>>(dictionary: D, key: keyof D, locale: Locale): string {
  return (dictionary[key] as LocalizedText)[locale];
}
