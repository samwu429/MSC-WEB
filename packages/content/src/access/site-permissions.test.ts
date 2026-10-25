import { describe, expect, it } from 'vitest';
import { MEMBER_ROLES } from './member-roles';
import { ROLE_SITE_PERMISSIONS, SITE_PERMISSIONS, canUseAdmin, sitePermissionsFor } from './site-permissions';

describe('site permissions', () => {
  it('covers every member network role', () => {
    expect(Object.keys(ROLE_SITE_PERMISSIONS).sort()).toEqual([...MEMBER_ROLES].sort());
  });

  it('keeps ordinary members and advisors out of the backend', () => {
    for (const role of ['student', 'alumni', 'honorary_alumni', 'honorary_external']) expect(canUseAdmin(role)).toBe(false);
  });

  it('lets the President, the Secretary-General and the Technology head edit everything', () => {
    for (const role of ['president', 'secretary_general', 'head_technology']) expect(sitePermissionsFor(role)).toEqual([...SITE_PERMISSIONS]);
    expect(sitePermissionsFor('vp_finance')).toEqual(['documents.edit']);
  });

  it('lets the Academic head run reviews but not people', () => {
    expect(sitePermissionsFor('head_academic')).toContain('reviews.edit');
    expect(sitePermissionsFor('head_academic')).not.toContain('people.edit');
  });

  it('grants nothing to an unknown role', () => {
    expect(sitePermissionsFor('owner')).toEqual([]);
    expect(sitePermissionsFor(undefined)).toEqual([]);
  });
});
