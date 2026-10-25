import type { Env } from '../env';
import { createSqliteD1, type SqliteD1 } from '../infrastructure/d1/testing/sqlite-d1';
import { clearSessionCache } from '../infrastructure/member-api/session-cache';
import { createMemoryBucket, type MemoryBucket } from '../infrastructure/r2/testing/memory-bucket';

/**
 * A complete Worker environment for tests: D1 on SQLite with every migration applied, an in-memory bucket, and a
 * stand-in member network that knows a fixed set of tokens. Route tests call app.request(path, init, test.env);
 * repository and cron tests use test.env directly.
 * 测试用的完整 Worker 环境：应用了全部迁移的 SQLite 版 D1、内存存储桶，以及只认识一组固定令牌的替身成员网络。
 * 路由测试用 app.request(path, init, test.env)；仓储与定时任务测试直接使用 test.env。
 */

export interface TestMember {
  id: string;
  displayName: string;
  role: string;
  status?: string;
}

/** Tokens the stand-in member network accepts, one per common office. */
/** 替身成员网络接受的令牌，每个常见职位一个。 */
export const TEST_TOKENS = {
  president: 'token-president',
  academic: 'token-head-academic',
  events: 'token-head-events',
  finance: 'token-vp-finance',
  student: 'token-student',
} as const;

const DEFAULT_MEMBERS: Record<string, TestMember> = {
  [TEST_TOKENS.president]: { id: 'mem_president', displayName: '测试主席', role: 'president' },
  [TEST_TOKENS.academic]: { id: 'mem_academic', displayName: '测试学术部长', role: 'head_academic' },
  [TEST_TOKENS.events]: { id: 'mem_events', displayName: '测试活动部长', role: 'head_events' },
  [TEST_TOKENS.finance]: { id: 'mem_finance', displayName: '测试财务副主席', role: 'vp_finance' },
  [TEST_TOKENS.student]: { id: 'mem_student', displayName: '测试同学', role: 'student' },
};

export interface TestEnv {
  env: Env;
  d1: SqliteD1;
  media: MemoryBucket;
  /** Tokens the member network accepts; tests may add or remove entries. */
  /** 成员网络接受的令牌；测试可以增删条目。 */
  members: Map<string, TestMember>;
  /** Paths the member network was asked for, in order. */
  /** 成员网络被请求的路径，按顺序记录。 */
  memberApiCalls: string[];
  close(): void;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function fakeMemberApi(members: Map<string, TestMember>, calls: string[]): Fetcher {
  return {
    async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const request = new Request(input as RequestInfo, init);
      const url = new URL(request.url);
      calls.push(`${request.method} ${url.pathname}`);
      const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
      if (url.pathname === '/auth/me') {
        const member = members.get(token);
        if (!member) return json({ error: { code: 'unauthorized', message: '请先登录' } }, 401);
        return json({ member: { status: 'active', ...member } });
      }
      if (url.pathname === '/auth/login') {
        const body = (await request.json()) as { email?: string; password?: string };
        const entry = [...members.entries()].find(([, member]) => `${member.id}@mail.utoronto.ca` === body.email);
        if (!entry || body.password !== 'correct horse') return json({ error: { code: 'unauthorized', message: '邮箱或密码不正确' } }, 401);
        return json({ token: entry[0], expiresAt: '2030-01-01T00:00:00.000Z', member: { status: 'active', ...entry[1] } });
      }
      if (url.pathname === '/auth/logout') return new Response(null, { status: 204 });
      return json({ error: { code: 'not_found', message: '未找到' } }, 404);
    },
    connect() {
      throw new Error('not supported');
    },
  } as unknown as Fetcher;
}

function fakeAssets(): Fetcher {
  return {
    async fetch(input: RequestInfo | URL): Promise<Response> {
      const url = new URL(new Request(input as RequestInfo).url);
      if (url.pathname === '/admin/index.html') return new Response('<!doctype html><title>admin</title>', { headers: { 'content-type': 'text/html' } });
      return new Response('Not Found', { status: 404 });
    },
    connect() {
      throw new Error('not supported');
    },
  } as unknown as Fetcher;
}

export function createTestEnv(overrides: Partial<Env> = {}): TestEnv {
  clearSessionCache();
  const d1 = createSqliteD1();
  const media = createMemoryBucket();
  const members = new Map(Object.entries(DEFAULT_MEMBERS));
  const memberApiCalls: string[] = [];
  const env: Env = {
    DB: d1.db,
    MEDIA: media.bucket,
    ASSETS: fakeAssets(),
    MEMBER_API: fakeMemberApi(members, memberApiCalls),
    MEMBER_API_ORIGIN: 'https://member-api.test',
    PUBLIC_ORIGIN: 'https://utmmsc.com',
    MEMBER_APP_URL: '/UTMMSC/',
    ANDROID_DOWNLOAD_URL: '/download/android',
    ...overrides,
  };
  return { env, d1, media, members, memberApiCalls, close: () => d1.close() };
}

/** A minimal ExecutionContext whose waitUntil promises can be awaited by the test. */
/** 最简化的 ExecutionContext，测试可以等待其 waitUntil 中的 Promise。 */
export function testExecutionContext(): ExecutionContext & { settle(): Promise<void> } {
  const pending: Promise<unknown>[] = [];
  return {
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
    props: {},
    async settle() {
      await Promise.allSettled(pending);
    },
  } as unknown as ExecutionContext & { settle(): Promise<void> };
}
