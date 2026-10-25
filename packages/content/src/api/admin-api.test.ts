import { describe, expect, it } from 'vitest';
import { isAdminApiPath } from './admin-api';

describe('isAdminApiPath', () => {
  it('matches the API prefix and every path under it', () => {
    for (const path of ['/admin/api', '/admin/api/', '/admin/api/session', '/admin/api/events/evt_1']) expect(isAdminApiPath(path)).toBe(true);
  });

  it('leaves the admin app, sibling paths and public pages alone', () => {
    for (const path of ['/admin', '/admin/', '/admin/events', '/admin/apiary', '/en/admin/api', '/api/auth/me']) expect(isAdminApiPath(path)).toBe(false);
  });
});
