import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { D1_LIMITS, createSqliteD1, sqlite, type SqliteD1 } from './sqlite-d1';

function selects(terms: number, operator = 'UNION ALL'): string {
  return Array.from({ length: terms }, (_, index) => `SELECT ${index} AS n`).join(` ${operator} `);
}

describe.skipIf(!sqlite)('D1 limits in the SQLite adapter', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  it(`runs a compound SELECT of ${D1_LIMITS.compoundTerms} terms and refuses one more`, async () => {
    expect((await d1.db.prepare(selects(5)).all()).results).toHaveLength(5);
    await expect(d1.db.prepare(selects(6)).all()).rejects.toThrow('D1_ERROR: too many terms in compound SELECT');
    for (const operator of ['UNION', 'INTERSECT', 'EXCEPT']) {
      await expect(d1.db.prepare(selects(6, operator)).all(), operator).rejects.toThrow('D1_ERROR: too many terms in compound SELECT');
    }
  });

  it('does not count compound keywords inside string literals, quoted names or comments', async () => {
    const sql = `SELECT 'UNION UNION UNION UNION UNION' AS "union except" -- UNION INTERSECT
      UNION ALL SELECT 'it''s UNION' /* EXCEPT EXCEPT */ AS n`;
    expect((await d1.db.prepare(sql).all()).results).toHaveLength(2);
  });

  it('refuses a LIKE or GLOB statement bound to a pattern over 50 bytes', async () => {
    const sql = 'SELECT slug FROM events WHERE slug LIKE ?';
    expect((await d1.db.prepare(sql).bind(`${'a'.repeat(49)}%`).all()).results).toEqual([]);
    await expect(d1.db.prepare(sql).bind(`${'a'.repeat(50)}%`).all()).rejects.toThrow('D1_ERROR: LIKE or GLOB pattern too complex');
    await expect(d1.db.prepare(sql).bind(`${'活'.repeat(17)}`).all()).rejects.toThrow('D1_ERROR: LIKE or GLOB pattern too complex');
    await expect(d1.db.prepare('SELECT slug FROM events WHERE slug GLOB ?').bind(`${'a'.repeat(51)}*`).all()).rejects.toThrow(
      'D1_ERROR: LIKE or GLOB pattern too complex',
    );
  });

  it('accepts long strings in statements without LIKE or GLOB', async () => {
    const row = await d1.db.prepare("SELECT ? AS text, 'LIKE' AS word").bind('a'.repeat(500)).first<{ text: string }>();
    expect(row?.text).toHaveLength(500);
  });

  it(`binds ${D1_LIMITS.boundParameters} parameters and refuses one more`, async () => {
    const sql = (count: number) => `SELECT ${Array.from({ length: count }, () => '?').join(' + ')} AS total`;
    const ones = (count: number) => Array.from({ length: count }, () => 1);
    expect(await d1.db.prepare(sql(100)).bind(...ones(100)).first('total')).toBe(100);
    await expect(d1.db.prepare(sql(101)).bind(...ones(101)).first()).rejects.toThrow('D1_ERROR: too many SQL variables');
  });

  it('refuses a whole batch when one statement breaks a limit', async () => {
    const insert = d1.db
      .prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('site', '{}', '2026-01-01T00:00:00.000Z', 'mem_x')");
    await expect(d1.db.batch([insert, d1.db.prepare(selects(6))])).rejects.toThrow('D1_ERROR: too many terms in compound SELECT');
    expect(d1.rows('SELECT key FROM settings')).toEqual([]);
  });
});
