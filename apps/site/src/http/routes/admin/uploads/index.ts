import { Hono } from 'hono';
import { MEDIA_KINDS, maxBytesFor, mediaUrl, type MediaKind, type MediaRecord, type SitePermission, type UploadResponse } from '@msc-web/content';
import { sanitizeFileName } from '../../../../domain/media/naming/file-name';
import { newMediaKey } from '../../../../domain/media/naming/media-key';
import { MAX_IMAGE_PIXELS, MAX_IMAGE_SIDE, judgeUpload, type UploadRejection } from '../../../../domain/media/upload-policy';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { nowIso } from '../../../../infrastructure/d1/records';
import { deleteMediaObjects, putMediaObject } from '../../../../infrastructure/r2/media-store';
import type { AppEnv } from '../../../context';
import { HttpError, badRequest, forbidden, payloadTooLarge } from '../../../errors';
import { readBoundedBytes } from '../../../request/body';

/**
 * POST /admin/api/uploads?kind=image|document&name=<original file name>, with the raw file as the body. The type is
 * decided from the bytes and the key is generated here. The file is stored before its media row is written, so a row
 * never points at a missing file. An upload stays unattached until a form saves it; the daily cleanup removes it if
 * that never happens.
 * POST /admin/api/uploads?kind=image|document&name=<原始文件名>，请求体为原始文件。类型根据字节判断，键在这里生成。
 * 文件先存储，再写入媒体记录，因此记录永远不会指向不存在的文件。上传的文件在表单保存之前不被任何记录使用；若始终未被使用，每日清理会将其删除。
 */
export const uploadRoutes = new Hono<AppEnv>();

/** PDFs are uploaded for public records and review materials only. */
/** 只有公开记录与复习资料需要上传 PDF。 */
const DOCUMENT_UPLOAD_PERMISSIONS: readonly SitePermission[] = ['documents.edit', 'reviews.edit'];

const KIND_LABELS: Record<MediaKind, string> = { image: '图片', document: 'PDF 文件' };

const UNSUPPORTED_MESSAGES: Record<MediaKind, string> = {
  image: '只支持 JPG、PNG 或 WebP 图片',
  document: '只支持 PDF 文件',
};

function isMediaKind(value: string | undefined): value is MediaKind {
  return (MEDIA_KINDS as readonly (string | undefined)[]).includes(value);
}

function tooLarge(kind: MediaKind): HttpError {
  return payloadTooLarge(`文件过大，${KIND_LABELS[kind]}不能超过 ${maxBytesFor(kind) / (1024 * 1024)} MB`);
}

function rejected(kind: MediaKind, reason: UploadRejection): HttpError {
  if (reason === 'image_too_large') {
    return badRequest(reason, `图片尺寸过大，宽和高不能超过 ${MAX_IMAGE_SIDE} 像素，总像素不能超过 ${MAX_IMAGE_PIXELS / 10_000} 万`);
  }
  return badRequest(reason, UNSUPPORTED_MESSAGES[kind]);
}

uploadRoutes.post('/', async (c) => {
  const kind = c.req.query('kind');
  if (!isMediaKind(kind)) throw badRequest('invalid_kind', '上传类型不正确');
  const identity = c.get('identity');
  if (kind === 'document' && !DOCUMENT_UPLOAD_PERMISSIONS.some((permission) => identity.permissions.includes(permission))) throw forbidden();

  const bytes = await readBoundedBytes(c.req.raw, maxBytesFor(kind), () => tooLarge(kind));
  const verdict = judgeUpload(kind, bytes);
  if (!verdict.accepted) throw rejected(kind, verdict.reason);

  const { contentType, width, height } = verdict.media;
  const key = newMediaKey(contentType);
  const media: MediaRecord = {
    key,
    url: mediaUrl(key),
    kind,
    contentType,
    size: bytes.byteLength,
    width,
    height,
    fileName: sanitizeFileName(c.req.query('name'), contentType),
    createdAt: nowIso(),
  };
  await putMediaObject(c.env.MEDIA, key, bytes, contentType, media.fileName);
  try {
    await insertMedia(c.env.DB, media, identity.memberId);
  } catch (error) {
    await deleteMediaObjects(c.env.MEDIA, [key]);
    throw error;
  }
  const response: UploadResponse = { media };
  return c.json(response, 201);
});
