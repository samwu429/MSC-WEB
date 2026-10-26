import type { LocalizedText } from '@msc-web/content';

/** Fixed text of the home page. Editable copy (tagline, intro, join text) comes from site settings instead. */
/** 首页的固定文字。可编辑的文案（标语、介绍、加入说明）来自网站设置。 */
export const HOME = {
  upcomingEvents: { zh: '近期活动', en: 'Upcoming events' },
  heroPhotoAlt: { zh: 'UTMMSC 学术讲座现场', en: 'Students at a UTMMSC academic talk' },
  heroUploadedPhotoAlt: { zh: 'UTMMSC 活动现场', en: 'Members at a UTMMSC event' },

  statsTitle: { zh: '联盟一览', en: 'UTMMSC at a glance' },
  statReviewSessions: { zh: '考前复习场次', en: 'Test review sessions' },
  statEvents: { zh: '活动', en: 'Events' },
  statCourses: { zh: '开设复习的课程', en: 'Courses with reviews' },
  statFeeValue: { zh: '$0', en: '$0' },
  statFee: { zh: '会费（章程第 3.4 条）', en: 'Membership fee (Article 3.4)' },

  pillarsEyebrow: { zh: '我们做什么', en: 'What we do' },
  pillarsTitle: { zh: '一起学习，一起成长', en: 'Learning and growing together' },
  pillarsLead: {
    zh: '依照章程，联盟的工作围绕学业支持、学术成长、课外交流与技术实践展开。',
    en: 'Under our constitution, our work spans academic support, scholarly growth, community life and hands-on technology.',
  },
  pillarReviewsTitle: { zh: '考前复习', en: 'Test reviews' },
  pillarReviewsText: {
    zh: '学术部为多门课程开设期中与期末复习，由熟悉课程的同学梳理重点、讲解练习。',
    en: 'The Academic Department runs midterm and final reviews for many courses, led by students who know the material well.',
  },
  pillarReviewsLink: { zh: '查看复习安排', en: 'See test reviews' },
  pillarAcademicTitle: { zh: '学术活动', en: 'Academic activities' },
  pillarAcademicText: {
    zh: '举办讲座与工作坊，在课外科研与学术写作方面提供同伴指导。我们坚守学术诚信，绝不代写。',
    en: 'Talks, workshops and peer mentorship in extracurricular research and scholarly writing. We uphold academic integrity and never ghostwrite.',
  },
  pillarAcademicLink: { zh: '浏览学术活动', en: 'Browse academic events' },
  pillarExtracurricularTitle: { zh: '课外活动', en: 'Extracurricular activities' },
  pillarExtracurricularText: {
    zh: '以兴趣为主题的活动、文化交流与中文学习，欢迎不同背景的同学一起参与。',
    en: 'Interest-based events, cultural exchange and Mandarin learning, open to students of every background.',
  },
  pillarExtracurricularLink: { zh: '浏览课外活动', en: 'Browse extracurricular events' },
  pillarTechnologyTitle: { zh: '技术项目', en: 'Technology projects' },
  pillarTechnologyText: {
    zh: '科技部管理联盟的 GitHub 组织，带领成员建设官网与各类系统，积累项目经验。',
    en: 'The Technology Department runs our GitHub organization and leads members in building the website and systems.',
  },
  pillarTechnologyLink: { zh: '访问 GitHub', en: 'Visit our GitHub' },

  eventsEyebrow: { zh: '近期安排', en: 'Coming up' },
  eventsLink: { zh: '全部活动', en: 'All events' },
  eventsEmptyTitle: { zh: '近期暂无活动', en: 'No upcoming events yet' },
  eventsEmptyText: {
    zh: '新活动发布后会第一时间显示在这里，也可以先看看往期活动。',
    en: 'New events appear here as soon as they are announced. Past events are on the events page.',
  },

  reviewsTitle: { zh: '本学期考前复习', en: 'Test reviews this term' },
  reviewsLead: { zh: '学术部本学期开设的期中与期末复习。', en: 'Midterm and final reviews the Academic Department is running this term.' },
  reviewsLink: { zh: '全部复习', en: 'All test reviews' },
  reviewsEmptyTitle: { zh: '本学期的复习安排即将公布', en: "This term's reviews will be announced soon" },
  reviewsEmptyText: { zh: '往期复习资料可以在考前复习页面查看。', en: 'Materials from earlier terms are on the test reviews page.' },

  partnersEyebrow: { zh: '携手同行', en: 'Working together' },
  partnersTitle: { zh: '赞助与合作', en: 'Sponsors and partners' },
  partnersLead: {
    zh: '感谢支持联盟活动的赞助商、合作商与联动社团。',
    en: 'Thank you to the sponsors, partners and partner clubs who support our events.',
  },
  partnersEmptyTitle: { zh: '赞助与合作名单即将公布', en: 'Our sponsors and partners will be announced soon' },
  partnersEmptyText: { zh: '有意赞助或合作，欢迎通过"关于我们"页面联系我们。', en: 'Interested in sponsoring or partnering with us? Get in touch through the About page.' },

  advisorsEyebrow: { zh: '我们的团队', en: 'Our people' },
  advisorsLink: { zh: '全部荣誉顾问', en: 'All Honorary Advisors' },

  memberAppEyebrow: { zh: '成员网络', en: 'Member Network' },
  memberAppTitle: { zh: '随时和联盟保持联系', en: 'Stay connected with UTMMSC' },
  memberAppLead: {
    zh: '成员网络是联盟的成员专属平台：频道聊天、私聊、成员名册、文件库与活动提醒。网页版和安卓 App 使用同一个账号，消息互通。',
    en: 'The member network is our members-only home: channel chats, direct messages, the member directory, the file library and event reminders. The website and the Android app share one account and the same messages.',
  },
  memberAppWebTitle: { zh: '网页版 · 电脑与 iPhone', en: 'Web · computer and iPhone' },
  memberAppWebText: {
    zh: '在浏览器中直接打开即可使用。iPhone 请用 Safari 打开成员网络，点「分享」，再选「添加到主屏幕」，用起来和 App 一样。',
    en: 'Open it in any browser. On iPhone, open the member network in Safari, tap Share, then Add to Home Screen, and it works like an app.',
  },
  memberAppAndroidTitle: { zh: '安卓 App', en: 'Android app' },
  memberAppAndroidText: {
    zh: '下载安装包后在手机上安装。与网页版是同一个账号，可以接收消息与活动通知。',
    en: 'Download the installer and install it on your phone. It uses the same account as the website and can notify you of messages and events.',
  },

  joinTitle: { zh: '加入 UTMMSC', en: 'Join UTMMSC' },
} satisfies Record<string, LocalizedText>;
