import type { LocalizedText } from '@msc-web/content';

/** Fixed text of the About page. The mission and contact details come from site settings instead. */
/** 关于页面的固定文字。宗旨与联系方式来自网站设置。 */
export const ABOUT = {
  heroTitle: { zh: '关于我们', en: 'About UTMMSC' },

  missionEyebrow: { zh: '我们的宗旨', en: 'Our mission' },
  missionTitle: { zh: '为什么有 UTMMSC', en: 'Why UTMMSC exists' },
  missionPhotoAlt: { zh: 'UTMMSC 成员在社区活动中交流', en: 'UTMMSC members talking at a community gathering' },
  integrityTitle: { zh: '学术诚信（章程第 2.3 条）', en: 'Academic integrity (Article 2.3)' },
  integrityText: {
    zh: '联盟遵守多伦多大学《学术行为守则》：我们不代写，也不替任何人完成计分作业；复习资料仅作学习辅助之用；我们不与任何违反守则的个人或机构合作。',
    en: 'We follow the University of Toronto Code of Behaviour on Academic Matters. We never ghostwrite or complete graded work for anyone, our review materials are study aids only, and we do not work with anyone who violates the Code.',
  },

  membershipEyebrow: { zh: '成员资格', en: 'Membership' },
  membershipTitle: { zh: '如何加入', en: 'How to join' },
  factOpenTitle: { zh: '面向所有学生', en: 'Open to every student' },
  factOpenText: {
    zh: '所有多伦多大学注册学生均可加入，欢迎不同专业与背景的同学。',
    en: 'Every registered University of Toronto student can join, from any program or background.',
  },
  factFeeTitle: { zh: '不收会费', en: 'No membership fee' },
  factFeeText: { zh: '加入联盟无需缴纳任何费用（章程第 3.4 条）。', en: 'Membership costs nothing (Article 3.4).' },
  factNetworkTitle: { zh: '在成员网络注册', en: 'Join on the member network' },
  factNetworkText: {
    zh: '使用多伦多大学邮箱在成员网络注册，即可成为成员。',
    en: 'Register on the member network with your U of T email to become a member.',
  },
  factDepartmentsTitle: { zh: '最多加入两个部门', en: 'Up to two Departments' },
  factDepartmentsText: {
    zh: '成员可以加入最多两个部门，参与部门的日常工作。',
    en: 'Members may join up to two Departments and take part in their work.',
  },

  organisationEyebrow: { zh: '组织架构', en: 'Organisation' },
  organisationTitle: { zh: '联盟如何运作', en: 'How the Group is organised' },
  organisationLead: {
    zh: '四位主席团成员统筹联盟的运作，五个部门分工负责具体工作。',
    en: 'Four Presidium officers lead the Group, and five Departments carry out its work.',
  },
  organisationLink: { zh: '认识我们的团队', en: 'Meet our people' },
  presidiumText: { zh: '主席团的四个职位及其职责（章程第 4.4 条）。', en: 'The four Presidium offices and their duties (Article 4.4).' },
  departmentsTitle: { zh: '五个部门', en: 'Five Departments' },
  departmentsText: { zh: '各部门的职能（章程第 4.2 条）。', en: 'What each Department does (Article 4.2).' },

  recordsEyebrow: { zh: '信息公开', en: 'Transparency' },
  recordsTitle: { zh: '公开记录', en: 'Public records' },
  recordsLead: {
    zh: '依照章程，我们在这里公开章程、年度公开账目、选举结果、部门大纲以及经删减的会议记录。',
    en: 'As our constitution requires, we publish the constitution, annual public accounts, election results, Department Outlines and redacted meeting records here.',
  },
  recordsEmptyTitle: { zh: '暂无公开记录', en: 'No records published yet' },
  recordsEmptyText: { zh: '文件发布后会显示在这里。', en: 'Records will appear here once they are published.' },
  pdf: { zh: 'PDF', en: 'PDF' },

  contactEyebrow: { zh: '联系方式', en: 'Get in touch' },
  contactTitle: { zh: '联系我们', en: 'Contact us' },
  contactLead: { zh: '欢迎通过以下任一方式联系联盟。', en: 'Reach the Group through any of the channels below.' },
  wechatQr: { zh: '微信二维码', en: 'WeChat QR code' },
  xiaohongshu: { zh: '小红书', en: 'Xiaohongshu (RED)' },
} satisfies Record<string, LocalizedText>;
