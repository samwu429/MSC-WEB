import type { LocalizedText } from '@msc-web/content';

/** Fixed text of the Academic Activities page, the Interest Classes page, and the way back from an interest class. */
/** "学术活动" 页面、"兴趣课" 页面以及从兴趣课返回的链接使用的固定文字。 */
export const ACADEMICS = {
  heroLead: {
    zh: '学术部在期中、期末前开设针对具体课程的考前复习，用中文开设不局限于任何一门课程的兴趣课，并举办学术讲座与工作坊。',
    en: 'The Academic Department runs test reviews for specific courses before midterms and finals, interest classes in Mandarin on topics beyond any one course, and academic talks and workshops.',
  },
  reviewsLead: {
    zh: '期中、期末前针对具体课程的复习，由熟悉课程的同学主讲。',
    en: 'Midterm and final reviews for specific courses, led by students who know the material.',
  },
  allReviews: { zh: '全部复习', en: 'All test reviews' },
  interestClassesLead: {
    zh: '用中文讲授大家感兴趣的知识，不跟随任何课程。',
    en: 'Talks in Mandarin on topics many students are curious about, outside any course.',
  },
  allInterestClasses: { zh: '全部兴趣课', en: 'All interest classes' },
  talksTitle: { zh: '讲座与工作坊', en: 'Talks and workshops' },
  talksLead: {
    zh: '学术部的讲座与工作坊与其他活动一起列在活动页面。',
    en: "The Academic Department's talks and workshops are listed on the Events page with the rest of our activities.",
  },
  allAcademicEvents: { zh: '浏览学术活动', en: 'Browse academic events' },

  interestHeroLead: {
    zh: '用中文聊聊大家感兴趣的知识，从经济学、计算机到更多领域，话题不设限。每节课独立成篇，想听哪节就来哪节。',
    en: 'Talks in Mandarin on things many of us are curious about, from economics to computer science and beyond. Each class stands on its own, so you can come to any of them.',
  },
  notTiedTitle: { zh: '不跟随课程', en: 'Not tied to any course' },
  notTiedText: {
    zh: '兴趣课不跟随任何课程，也不是课程辅导。话题可能与你所学的内容有所重合，但课上从不讲解计入成绩的作业、测验或考试。',
    en: "Interest classes don't follow any course and aren't tutoring. A topic may overlap with something you study, but no class works through graded assignments, quizzes or exams.",
  },
  seeReviews: { zh: '考前需要针对具体课程的复习，请看考前复习', en: 'For help with a specific course before a test, see Test Reviews' },
  upcomingTitle: { zh: '近期兴趣课', en: 'Upcoming classes' },
  firstComingTitle: { zh: '第一批兴趣课即将推出', en: 'The first interest classes are coming soon' },
  firstComingText: { zh: '话题与时间确定后会在这里公布。', en: 'Topics and times will be posted here.' },
  noneUpcomingTitle: { zh: '暂时没有即将开始的兴趣课', en: 'No upcoming interest classes right now' },
  noneUpcomingText: { zh: '新的兴趣课确定后会在这里公布。', en: 'New classes will be posted here once their topics and times are set.' },
  pastTitle: { zh: '往期兴趣课', en: 'Past classes' },
  pageEmptyTitle: { zh: '这一页没有更多兴趣课', en: 'There are no more classes on this page' },
  pagerLabel: { zh: '往期兴趣课分页', en: 'Past class pages' },
} satisfies Record<string, LocalizedText>;
