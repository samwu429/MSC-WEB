import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app';
import { createTestEnv, type TestEnv } from '../../testing/test-env';
import { sqlite } from '../../../infrastructure/d1/testing/sqlite-d1';

describe.skipIf(!sqlite)('admin app routes', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  it('answers an unknown admin API path with a JSON 404, whatever the method', async () => {
    for (const init of [{ method: 'GET' }, { method: 'POST' }]) {
      const response = await app.request('/admin/api/nope', init, test.env);
      expect(response.status, init.method).toBe(404);
      expect(await response.json()).toEqual({ error: { code: 'not_found', message: '接口不存在' } });
    }
  });

  it('serves the app for admin screens, including a sibling of the API prefix', async () => {
    for (const path of ['/admin/', '/admin/events', '/admin/apiary']) {
      const response = await app.request(path, {}, test.env);
      expect(response.status, path).toBe(200);
      expect(response.headers.get('content-type'), path).toContain('text/html');
    }
  });

  it('adds the trailing slash to /admin', async () => {
    const response = await app.request('/admin?from=menu', {}, test.env);
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/admin/?from=menu');
  });
});
