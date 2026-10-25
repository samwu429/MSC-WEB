import { describe, expect, it } from 'vitest';
import type { AdminIdentity } from '@msc-web/content';
import { ApiError } from '../api/client';
import { isAnotherMember, startupFailure } from './session-checks';

describe('startupFailure', () => {
  it('keeps the stored sign-in when the network or the member network is down', () => {
    expect(startupFailure(new ApiError(0, 'network', '网络连接失败，请检查网络后重试'), 'backend')).toEqual({
      kind: 'unavailable',
      notice: '网络连接失败，请检查网络后重试',
    });
    expect(startupFailure(new ApiError(503, 'member_api_unavailable', '成员网络暂时无法验证登录，请稍后再试'), 'member-app')).toEqual({
      kind: 'unavailable',
      notice: '成员网络暂时无法验证登录，请稍后再试',
    });
    expect(startupFailure(new ApiError(500, 'internal', '服务器出错，请稍后再试'), 'developer').kind).toBe('unavailable');
    expect(startupFailure(new SyntaxError('Unexpected token'), 'backend')).toEqual({ kind: 'unavailable', notice: '暂时无法验证登录，请稍后重试' });
  });

  it('signs out on 401, quietly for a borrowed member network session', () => {
    const expired = new ApiError(401, 'unauthorized', '登录已过期，请重新登录');
    expect(startupFailure(expired, 'backend')).toEqual({ kind: 'refused', notice: '登录已过期，请重新登录', logout: false });
    expect(startupFailure(expired, 'member-app')).toEqual({ kind: 'refused', notice: null, logout: false });
  });

  it('ends a refused session only when this backend created it', () => {
    const demoted = new ApiError(403, 'forbidden', '只有主席团、部长等干部可以进入官网后台');
    expect(startupFailure(demoted, 'backend')).toEqual({ kind: 'refused', notice: '只有主席团、部长等干部可以进入官网后台', logout: true });
    expect(startupFailure(demoted, 'member-app')).toEqual({ kind: 'refused', notice: '你的成员网络账号没有官网后台权限，可换一个干部账号登录', logout: false });
    expect(startupFailure(demoted, 'developer')).toMatchObject({ kind: 'refused', logout: false });
  });
});

describe('isAnotherMember', () => {
  const identity = (memberId: string): AdminIdentity => ({
    memberId,
    displayName: '张三',
    role: 'president',
    roleLabel: { zh: '主席', en: 'President' },
    permissions: ['events.edit'],
    source: 'member',
  });

  it('keeps the open screens when the same member signs in again, even with a fresh identity', () => {
    expect(isAnotherMember(identity('mem_1'), { ...identity('mem_1'), permissions: [] })).toBe(false);
  });

  it('resets the screens when a different member signs in', () => {
    expect(isAnotherMember(identity('mem_1'), identity('mem_2'))).toBe(true);
  });

  it('has nothing to reset on a first sign-in', () => {
    expect(isAnotherMember(null, identity('mem_1'))).toBe(false);
  });
});
