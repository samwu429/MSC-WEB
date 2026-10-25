import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LoginResponse, SessionOptionsResponse, SessionResponse } from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';
import { MAX_JSON_BYTES } from '../../../request/body';

const DEV_TOKEN = 'dev-token-0123456789abcdefghij';

describe.skipIf(!sqlite)('admin sign-in', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  async function post(path: string, body: unknown, env = test.env) {
    const ctx = testExecutionContext();
    const response = await app.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, env, ctx);
    await ctx.settle();
    return response;
  }

  it('signs an officer in through the member network', async () => {
    const response = await post('/admin/api/session/login', { email: 'mem_president@mail.utoronto.ca', password: 'correct horse' });
    expect(response.status).toBe(200);
    const body = (await response.json()) as LoginResponse;
    expect(body.token).toBe(TEST_TOKENS.president);
    expect(body.identity.permissions).toContain('people.edit');
    expect(body.identity.roleLabel.zh).toBe('主席');
  });

  it('passes the member network refusal through', async () => {
    const response = await post('/admin/api/session/login', { email: 'mem_president@mail.utoronto.ca', password: 'wrong' });
    expect(response.status).toBe(401);
    expect(((await response.json()) as { error: { message: string } }).error.message).toBe('邮箱或密码不正确');
  });

  it('stops reading a sign-in body with no declared length once it passes the JSON limit', async () => {
    const chunk = new Uint8Array(64 * 1024).fill(0x20);
    let pulled = 0;
    let cancelled = false;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(chunk);
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new Request('http://localhost/admin/api/session/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: endless,
      duplex: 'half',
    } as RequestInit);
    expect(request.headers.get('content-length')).toBeNull();

    const response = await app.request(request, undefined, test.env);
    expect(response.status).toBe(413);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('too_large');
    expect(pulled).toBeLessThanOrEqual(MAX_JSON_BYTES / chunk.length + 3);
    expect(cancelled).toBe(true);
    expect(test.memberApiCalls).toEqual([]);
  });

  it('refuses members without an office and ends the session they just got', async () => {
    const response = await post('/admin/api/session/login', { email: 'mem_student@mail.utoronto.ca', password: 'correct horse' });
    expect(response.status).toBe(403);
    expect(test.memberApiCalls).toContain('POST /auth/logout');
  });

  it('reports who is signed in', async () => {
    const response = await app.request('/admin/api/session', asOfficer(TEST_TOKENS.academic), test.env);
    expect(response.status).toBe(200);
    const body = (await response.json()) as SessionResponse;
    expect(body.identity.permissions).toEqual(['reviews.edit', 'events.edit']);
  });

  it('rejects an unknown token', async () => {
    const response = await app.request('/admin/api/session', asOfficer('nope'), test.env);
    expect(response.status).toBe(401);
  });

  it('answers 503 when the member network is down', async () => {
    const env = { ...test.env, MEMBER_API: { fetch: async () => new Response('down', { status: 502 }) } as unknown as Fetcher };
    const response = await app.request('/admin/api/session', asOfficer('token-x'), env);
    expect(response.status).toBe(503);
  });

  it('accepts the developer token only on localhost', async () => {
    const env = { ...test.env, DEV_ADMIN_TOKEN: DEV_TOKEN };
    const local = await app.request('http://localhost:8787/admin/api/session', asOfficer(DEV_TOKEN), env);
    expect(local.status).toBe(200);
    expect(((await local.json()) as SessionResponse).identity.source).toBe('developer');
    const remote = await app.request('https://utmmsc.com/admin/api/session', asOfficer(DEV_TOKEN), env);
    expect(remote.status).toBe(401);
    const options = (await (await app.request('https://utmmsc.com/admin/api/session/options', {}, env)).json()) as SessionOptionsResponse;
    expect(options.developerSignIn).toBe(false);
  });

  it('ignores a developer token that is too short', async () => {
    const env = { ...test.env, DEV_ADMIN_TOKEN: 'short' };
    const response = await app.request('http://localhost:8787/admin/api/session', asOfficer('short'), env);
    expect(response.status).toBe(401);
  });
});

describe.skipIf(!sqlite)('admin section guards', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  it('requires a session for every section', async () => {
    for (const path of ['/admin/api/summary', '/admin/api/people', '/admin/api/events', '/admin/api/courses', '/admin/api/review-sessions/x', '/admin/api/documents', '/admin/api/settings']) {
      const response = await app.request(path, {}, test.env);
      expect(response.status, path).toBe(401);
    }
  });

  it('keeps members without an office out', async () => {
    const response = await app.request('/admin/api/summary', asOfficer(TEST_TOKENS.student), test.env);
    expect(response.status).toBe(403);
  });

  it('keeps each officer to their own sections', async () => {
    const people = await app.request('/admin/api/people', asOfficer(TEST_TOKENS.academic), test.env);
    expect(people.status).toBe(403);
    const documents = await app.request('/admin/api/documents', asOfficer(TEST_TOKENS.events), test.env);
    expect(documents.status).toBe(403);
    const settings = await app.request('/admin/api/settings', asOfficer(TEST_TOKENS.finance), test.env);
    expect(settings.status).toBe(403);
  });

  it('answers unknown admin API paths with JSON, never the app page', async () => {
    const response = await app.request('/admin/api/nothing-here', asOfficer(TEST_TOKENS.president), test.env);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
