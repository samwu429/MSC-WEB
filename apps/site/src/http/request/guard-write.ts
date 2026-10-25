import { isForeignKeyViolation, isUniqueViolation } from '../../infrastructure/d1/records';
import { invalid, type HttpError } from '../errors';
import { missingFile } from './media';

export interface WriteGuards {
  /** The answer when a UNIQUE constraint refuses the write, the same one the check before it gives. */
  /** UNIQUE 约束拒绝写入时的答复，与写入前的检查给出的答复相同。 */
  unique?: () => HttpError;
  /** The form field of the upload the write references, where a FOREIGN KEY failure is reported. */
  /** 写入所引用的上传文件所在的表单字段，FOREIGN KEY 失败时在该字段报告。 */
  mediaField?: string;
}

/**
 * Runs a write that was checked just before. Another save can claim a unique value, or the cleanup can remove an
 * upload, between the check and the write; the constraint then refuses it, and the editor gets the same answer as
 * from the check instead of a generic 500.
 * 执行一次刚刚检查过的写入。在检查与写入之间，其他保存可能占用某个唯一值，清理也可能移除某个上传文件；此时约束会拒绝写入，
 * 编辑者得到与检查时相同的答复，而不是通用的 500 错误。
 */
export async function guardWrite<T>(write: () => Promise<T>, guards: WriteGuards): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (guards.unique && isUniqueViolation(error)) throw guards.unique();
    if (guards.mediaField && isForeignKeyViolation(error)) throw invalid([missingFile(guards.mediaField)]);
    throw error;
  }
}
