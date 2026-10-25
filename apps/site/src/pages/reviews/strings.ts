import type { ExamKind, Locale, LocalizedText } from '@msc-web/content';

/** Fixed text of the test review pages and of course cards wherever they appear. */
/** 考前复习页面以及各处课程卡片使用的固定文字。 */
export const REVIEWS = {
  heroEyebrow: { zh: '学术部', en: 'Academic Department' },
  heroLead: {
    zh: '每个学期，学术部都会为多门课程开设期中与期末复习，由熟悉课程的同学带大家梳理重点、讲解例题。',
    en: 'Every term, the Academic Department runs midterm and final reviews for many courses, led by students who know the material and walk through key concepts and practice problems.',
  },
  termTabsLabel: { zh: '学期', en: 'Terms' },
  integrityTitle: { zh: '学术诚信', en: 'Academic integrity' },
  integrityText: {
    zh: '考前复习是学术部提供的学习辅助，帮助同学理解和巩固课程内容。我们不代写，也不替任何人完成计入成绩的作业、测验或考试（章程第 2.3 条）。',
    en: 'Test reviews are study aids from the Academic Department that help students understand and consolidate course material. We do not ghostwrite, and we never complete graded assignments, quizzes or exams for anyone (Constitution, Article 2.3).',
  },
  termLead: { zh: '本学期已安排复习的课程。', en: 'Courses with reviews scheduled this term.' },
  otherTermLead: { zh: '所选学期开设复习的课程。', en: 'Courses with reviews in the selected term.' },
  termEmptyTitle: { zh: '这个学期还没有发布复习', en: 'No reviews have been published for this term yet' },
  termEmptyText: { zh: '复习安排确定后会在这里公布。', en: 'Review sessions will be posted here once they are scheduled.' },
  allCoursesTitle: { zh: '全部课程', en: 'All courses' },
  allCoursesLead: { zh: '查看每门课程历次复习的时间、资料与回放。', en: 'Every review we have run for each course, with materials and recordings.' },
  allCoursesEmpty: { zh: '还没有发布复习的课程', en: 'No courses have published reviews yet' },
  backToReviews: { zh: '全部复习', en: 'All test reviews' },
  courseEyebrow: { zh: '课程复习', en: 'Course reviews' },
  courseEmptyTitle: { zh: '这门课程暂时没有已发布的复习', en: 'No reviews have been published for this course yet' },
  courseEmptyText: { zh: '新的复习安排公布后会出现在这里。', en: 'New review sessions will appear here once they are announced.' },
  materials: { zh: '复习资料', en: 'Study materials' },
  recording: { zh: '观看回放', en: 'Watch recording' },
  presenters: { zh: '主讲', en: 'Presenters' },
} satisfies Record<string, LocalizedText>;

/** Short exam names for the coloured chip beside a session heading. */
/** 场次标题旁彩色标签使用的简短复习类型名称。 */
export const EXAM_CHIP_LABELS: Record<ExamKind, LocalizedText> = {
  midterm: { zh: '期中', en: 'Midterm' },
  final: { zh: '期末', en: 'Final' },
};

/** "资料（3）" or "Materials (3)". */
/** "资料（3）" 或 "Materials (3)"。 */
export function materialsCount(count: number, locale: Locale): string {
  return locale === 'zh' ? `资料（${count}）` : `Materials (${count})`;
}

/** "主讲：张三、李四" or "Presenters: Alex Chen, Mia Li". */
/** "主讲：张三、李四" 或 "Presenters: Alex Chen, Mia Li"。 */
export function presentersLine(names: string, locale: Locale): string {
  return locale === 'zh' ? `${REVIEWS.presenters.zh}：${names}` : `${REVIEWS.presenters.en}: ${names}`;
}

/** The page description of a course: the course and what its page offers. */
/** 课程页面的描述：课程本身以及页面提供的内容。 */
export function courseDescription(code: string, title: string, locale: Locale): string {
  const course = title ? `${code} ${title}` : code;
  return locale === 'zh' ? `${course} 的期中与期末复习安排、学习资料与回放。` : `Midterm and final reviews for ${course}: schedules, study materials and recordings.`;
}
