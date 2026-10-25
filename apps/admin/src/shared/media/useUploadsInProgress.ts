import { useCallback, useState } from 'react';

/** The status a form shows beside its save button while an upload runs. */
/** 上传进行期间表单在保存按钮旁显示的状态。 */
export const UPLOADING_STATUS = '文件上传中…';

/**
 * Whether any upload field of a form is still uploading. Pass onBusyChange to each of the form's upload fields and
 * keep the save button disabled while `uploading` is true.
 * 表单中是否仍有上传控件在上传。把 onBusyChange 传给表单中的每个上传控件，并在 `uploading` 为真时禁用保存按钮。
 */
export function useUploadsInProgress(): { uploading: boolean; onBusyChange: (busy: boolean) => void } {
  const [count, setCount] = useState(0);
  const onBusyChange = useCallback((busy: boolean) => setCount((current) => Math.max(0, current + (busy ? 1 : -1))), []);
  return { uploading: count > 0, onBusyChange };
}
