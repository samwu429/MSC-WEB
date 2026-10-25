import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SummaryResponse } from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, createTestEnv, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const STAMP = '2026-10-01T00:00:00.000Z';

describe.skipIf(!sqlite)('summary route', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  it('gives every officer the counts and the latest 20 changes, newest first', async () => {
    test.d1.exec(`
      INSERT INTO people (id, section, position, visible, created_at, updated_at) VALUES
        ('per_1', 'presidium', 'president', 1, '${STAMP}', '${STAMP}'),
        ('per_2', 'presidium', 'secretary_general', 0, '${STAMP}', '${STAMP}');
      INSERT INTO events (id, slug, category, status, starts_at, created_at, updated_at) VALUES
        ('evt_1', 'welcome', 'extracurricular', 'published', '2099-09-01T18:00', '${STAMP}', '${STAMP}'),
        ('evt_2', 'old', 'academic', 'published', '2001-09-01T18:00', '${STAMP}', '${STAMP}'),
        ('evt_3', 'draft', 'academic', 'draft', '2099-09-02T18:00', '${STAMP}', '${STAMP}');
    `);
    for (let index = 0; index < 25; index += 1) {
      const at = new Date(Date.parse(STAMP) + index * 60_000).toISOString();
      test.d1.raw
        .prepare('INSERT INTO change_log (id, at, member_id, member_name, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(`chg_${index}`, at, 'mem_president', '测试主席', 'update', 'event', 'evt_1', `修改 ${index}`);
    }

    const response = await app.request('/admin/api/summary', asOfficer(TEST_TOKENS.events), test.env);
    expect(response.status).toBe(200);
    const body = (await response.json()) as SummaryResponse;
    expect(body.counts).toEqual({ people: 1, eventsPublished: 2, eventsDraft: 1, upcomingEvents: 1, courses: 0, reviewSessions: 0, documents: 0 });
    expect(body.recentChanges).toHaveLength(20);
    expect(body.recentChanges[0]).toEqual({
      id: 'chg_24',
      at: new Date(Date.parse(STAMP) + 24 * 60_000).toISOString(),
      memberId: 'mem_president',
      memberName: '测试主席',
      action: 'update',
      entity: 'event',
      entityId: 'evt_1',
      summary: '修改 24',
    });
    expect(body.recentChanges.at(-1)?.id).toBe('chg_5');
  });

  it('keeps members without an office out', async () => {
    expect((await app.request('/admin/api/summary', asOfficer(TEST_TOKENS.student), test.env)).status).toBe(403);
  });
});
