/**
 * An in-memory stand-in for the R2 bucket in tests: put, get (with byte ranges), head and delete, with the HTTP
 * metadata that /media reads back.
 * 测试中替代 R2 存储桶的内存实现：支持 put、get（含字节范围）、head 与 delete，并保存 /media 会读回的 HTTP 元数据。
 */

interface StoredObject {
  bytes: Uint8Array;
  contentType: string | undefined;
  customMetadata: Record<string, string>;
  uploaded: Date;
  etag: string;
}

export interface MemoryBucket {
  bucket: R2Bucket;
  objects: Map<string, StoredObject>;
}

function toBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === 'string') return new TextEncoder().encode(value);
  throw new Error('memory bucket accepts bytes or text only');
}

function objectFor(key: string, stored: StoredObject, body: Uint8Array | null): R2ObjectBody | R2Object {
  const base = {
    key,
    version: stored.etag,
    size: stored.bytes.length,
    etag: stored.etag,
    httpEtag: `"${stored.etag}"`,
    uploaded: stored.uploaded,
    httpMetadata: { contentType: stored.contentType },
    customMetadata: stored.customMetadata,
    checksums: {},
    storageClass: 'Standard',
    writeHttpMetadata(headers: Headers) {
      if (stored.contentType) headers.set('content-type', stored.contentType);
    },
  };
  if (!body) return base as unknown as R2Object;
  return {
    ...base,
    body: new Response(body).body,
    bodyUsed: false,
    arrayBuffer: async () => body.slice().buffer,
    text: async () => new TextDecoder().decode(body),
    json: async () => JSON.parse(new TextDecoder().decode(body)) as unknown,
    blob: async () => new Blob([body]),
  } as unknown as R2ObjectBody;
}

export function createMemoryBucket(): MemoryBucket {
  const objects = new Map<string, StoredObject>();
  let counter = 0;
  const bucket = {
    async put(key: string, value: unknown, options?: R2PutOptions) {
      counter += 1;
      const httpMetadata = options?.httpMetadata as R2HTTPMetadata | undefined;
      objects.set(key, {
        bytes: toBytes(value),
        contentType: httpMetadata?.contentType,
        customMetadata: options?.customMetadata ?? {},
        uploaded: new Date(),
        etag: `etag${counter}`,
      });
      return objectFor(key, objects.get(key) as StoredObject, null);
    },
    async get(key: string, options?: R2GetOptions) {
      const stored = objects.get(key);
      if (!stored) return null;
      const range = options?.range as { offset?: number; length?: number } | undefined;
      const start = range?.offset ?? 0;
      const end = range?.length !== undefined ? start + range.length : stored.bytes.length;
      return objectFor(key, stored, stored.bytes.slice(start, end));
    },
    async head(key: string) {
      const stored = objects.get(key);
      return stored ? objectFor(key, stored, null) : null;
    },
    async delete(keys: string | string[]) {
      for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key);
    },
  } as unknown as R2Bucket;
  return { bucket, objects };
}
