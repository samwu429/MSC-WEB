import type { Env } from '../../env';
import type { TestEnv } from '../../testing/test-env';

/**
 * Helpers for route tests. The environment itself lives in src/testing so that repository and cron tests need not
 * import the http layer; it is re-exported here so route and page tests import everything from one place.
 * 路由测试的辅助工具。测试环境本身位于 src/testing，仓储与定时任务测试因此无需引用 http 层；这里再导出它，路由与页面测试可从同一处导入全部内容。
 */
export { TEST_TOKENS, createTestEnv, testExecutionContext, type TestEnv, type TestMember } from '../../testing/test-env';

/** Request headers for an officer token, with an optional JSON body. */
/** 带有干部令牌的请求头，可附带 JSON 请求体。 */
export function asOfficer(token: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): RequestInit {
  return {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

/**
 * The test environment, except that `change` runs just before each batch, as when another save or the daily
 * cleanup changes the database after a route checked it but before the route writes.
 * 测试环境，只是在每个批次执行之前运行 `change`，模拟另一次保存或每日清理恰好在路由检查之后、写入之前修改数据库的情况。
 */
export function changingBeforeWrite(test: TestEnv, change: () => void): Env {
  const db = test.env.DB;
  const DB = Object.assign(Object.create(db) as D1Database, {
    batch(statements: D1PreparedStatement[]) {
      change();
      return db.batch(statements);
    },
  });
  return { ...test.env, DB };
}

/** The test environment, with the media row of `key` deleted just before each batch. */
/** 测试环境，在每个批次执行之前删除 `key` 的媒体记录。 */
export function removingMediaBeforeWrite(test: TestEnv, key: string): Env {
  return changingBeforeWrite(test, () => test.d1.raw.prepare('DELETE FROM media WHERE key = ?').run(key));
}
