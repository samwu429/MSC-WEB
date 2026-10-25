import { Hono } from 'hono';
import {
  validateCourseInput,
  validateReviewSessionInput,
  type Course,
  type CourseResponse,
  type CoursesResponse,
  type ReviewSessionResponse,
} from '@msc-web/content';
import { createCourse, deleteCourse, findCourse, isCourseCodeTaken, listCourseSummaries, updateCourse } from '../../../../infrastructure/d1/courses';
import { createSession, listSessionDetailsOfCourse } from '../../../../infrastructure/d1/review-sessions';
import { releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { invalid, notFound, stale, type HttpError } from '../../../errors';
import { readJsonBody, readVersionedBody, validOrThrow } from '../../../request/body';
import { guardWrite, type WriteGuards } from '../../../request/guard-write';

/**
 * Courses of the test review section at /admin/api/courses. New review sessions are created here under their
 * course; existing sessions and their materials are edited under /admin/api/review-sessions.
 * 考前复习板块的课程接口，位于 /admin/api/courses。新的复习场次在所属课程下创建；已有场次及其资料在 /admin/api/review-sessions 下编辑。
 */
export const courseRoutes = new Hono<AppEnv>();

function duplicateCode(): HttpError {
  return invalid([{ field: 'code', message: '该课程代码已存在' }]);
}

/** Ids are random, so a UNIQUE failure means a concurrent save took the code between the check and the write. */
/** id 是随机生成的，因此 UNIQUE 失败意味着在检查与写入之间，同时进行的另一次保存占用了该课程代码。 */
const COURSE_WRITE: WriteGuards = { unique: duplicateCode };

async function courseResponse(db: D1Database, course: Course): Promise<CourseResponse> {
  return { course, sessions: await listSessionDetailsOfCourse(db, course.id) };
}

courseRoutes.get('/', async (c) => {
  const body: CoursesResponse = { courses: await listCourseSummaries(c.env.DB) };
  return c.json(body);
});

courseRoutes.post('/', async (c) => {
  const input = validOrThrow(validateCourseInput(await readJsonBody(c)));
  if (await isCourseCodeTaken(c.env.DB, input.code, null)) throw duplicateCode();
  const course = await guardWrite(() => createCourse(c.env.DB, c.get('identity'), input), COURSE_WRITE);
  const body: CourseResponse = { course, sessions: [] };
  return c.json(body, 201);
});

courseRoutes.get('/:id', async (c) => {
  const course = await findCourse(c.env.DB, c.req.param('id'));
  if (!course) throw notFound();
  return c.json(await courseResponse(c.env.DB, course));
});

courseRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { value, expectedUpdatedAt } = await readVersionedBody(c);
  const input = validOrThrow(validateCourseInput(value));
  if (await isCourseCodeTaken(c.env.DB, input.code, id)) throw duplicateCode();
  const update = await guardWrite(() => updateCourse(c.env.DB, c.get('identity'), id, input, expectedUpdatedAt), COURSE_WRITE);
  if (update.outcome !== 'updated') throw update.outcome === 'missing' ? notFound() : stale();
  return c.json(await courseResponse(c.env.DB, update.course));
});

courseRoutes.delete('/:id', async (c) => {
  const files = await deleteCourse(c.env.DB, c.get('identity'), c.req.param('id'));
  if (!files) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, files));
  return c.body(null, 204);
});

courseRoutes.post('/:id/sessions', async (c) => {
  const course = await findCourse(c.env.DB, c.req.param('id'));
  if (!course) throw notFound();
  const input = validOrThrow(validateReviewSessionInput(await readJsonBody(c)));
  const session = await createSession(c.env.DB, c.get('identity'), course, input);
  const body: ReviewSessionResponse = { session: { ...session, materials: [] } };
  return c.json(body, 201);
});
