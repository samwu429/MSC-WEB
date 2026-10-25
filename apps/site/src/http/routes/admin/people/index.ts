import { Hono } from 'hono';
import {
  defaultPositionTitle,
  isSingleHolderPosition,
  pickText,
  validatePersonInput,
  type PeopleResponse,
  type PersonInput,
  type PersonResponse,
} from '@msc-web/content';
import { createPerson, deletePerson, findPerson, findVisibleOfficeHolder, listPeople, updatePerson } from '../../../../infrastructure/d1/people';
import { droppedKeys, releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { conflict, notFound, stale } from '../../../errors';
import { readJsonBody, readVersionedBody, validOrThrow } from '../../../request/body';
import { guardWrite, type WriteGuards } from '../../../request/guard-write';
import { requireMediaKeys } from '../../../request/media';

/**
 * "Our People" in the editing backend: the Presidium, Department Leads and Honorary Advisors, hidden entries
 * included.
 * 编辑后台中的 "我们的团队"：主席团、部长团与荣誉顾问，包括已隐藏的条目。
 */
export const peopleRoutes = new Hono<AppEnv>();

/**
 * Offices with one holder (each Presidium office and each Department Head) may have one visible person at a time.
 * Hidden people never block, so an editor can prepare the next holder before hiding the current one.
 * 只能由一人担任的职位（每个主席团职位与每位部长）同一时间最多只能有一位正在显示的成员。
 * 隐藏的成员不会造成冲突，编辑者因此可以先准备好下一任，再隐藏现任。
 */
async function requireOfficeAvailable(db: D1Database, input: PersonInput, exceptId: string | null): Promise<void> {
  if (!input.visible || !isSingleHolderPosition(input.position)) return;
  const holder = await findVisibleOfficeHolder(db, input.position, input.department, exceptId);
  if (!holder) return;
  const office = defaultPositionTitle(input.position, input.department).zh;
  const holderName = pickText(holder.name, 'zh');
  throw conflict('office_taken', `${office}已由 ${holderName} 担任，请先隐藏 ${holderName}，或选择其他职位`);
}

async function requireSaveable(db: D1Database, input: PersonInput, exceptId: string | null): Promise<void> {
  await requireMediaKeys(db, [{ field: 'photoKey', key: input.photoKey, kind: 'image' }]);
  await requireOfficeAvailable(db, input, exceptId);
}

/** Ids are random, so a UNIQUE failure comes from the single-holder index of migration 0002: another save filled the office. */
/** id 是随机生成的，因此 UNIQUE 失败只会来自迁移 0002 中的单人职位索引，即另一次保存刚刚占用了该职位。 */
const PERSON_WRITE: WriteGuards = {
  unique: () => conflict('office_taken', '该职位刚刚已由其他成员担任，请刷新页面后再保存'),
  mediaField: 'photoKey',
};

peopleRoutes.get('/', async (c) => {
  const response: PeopleResponse = { people: await listPeople(c.env.DB) };
  return c.json(response);
});

peopleRoutes.post('/', async (c) => {
  const input = validOrThrow(validatePersonInput(await readJsonBody(c)));
  await requireSaveable(c.env.DB, input, null);
  const response: PersonResponse = { person: await guardWrite(() => createPerson(c.env.DB, c.get('identity'), input), PERSON_WRITE) };
  return c.json(response, 201);
});

peopleRoutes.get('/:id', async (c) => {
  const person = await findPerson(c.env.DB, c.req.param('id'));
  if (!person) throw notFound();
  const response: PersonResponse = { person };
  return c.json(response);
});

peopleRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { value, expectedUpdatedAt } = await readVersionedBody(c);
  const input = validOrThrow(validatePersonInput(value));
  const current = await findPerson(c.env.DB, id);
  if (!current) throw notFound();
  // A stale copy is refused before the office check, so the editor reloads first and no change log row is written
  // for a save that cannot apply. The guarded UPDATE still catches a save that lands in between.
  // 过期的副本在职位检查之前就被拒绝，编辑者因此会先刷新，也不会为无法生效的保存写入修改日志。
  // 在此期间插入的其他保存仍由带版本条件的 UPDATE 拦截。
  if (current.updatedAt !== expectedUpdatedAt) throw stale();
  await requireSaveable(c.env.DB, input, id);

  const result = await guardWrite(() => updatePerson(c.env.DB, c.get('identity'), id, input, expectedUpdatedAt), PERSON_WRITE);
  if (result.outcome === 'missing') throw notFound();
  if (result.outcome === 'stale') throw stale();
  c.executionCtx.waitUntil(releaseMedia(c.env, droppedKeys([current.photoKey], [input.photoKey])));
  const response: PersonResponse = { person: result.person };
  return c.json(response);
});

peopleRoutes.delete('/:id', async (c) => {
  const person = await deletePerson(c.env.DB, c.get('identity'), c.req.param('id'));
  if (!person) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, [person.photoKey]));
  return c.body(null, 204);
});
