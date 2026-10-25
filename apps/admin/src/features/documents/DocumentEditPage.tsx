import { useNavigate, useParams } from 'react-router-dom';
import { documentsApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { withNotice } from '../../shared/feedback/useArrivalNotice';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { DocumentForm } from './edit/DocumentForm';

/**
 * Creating and editing share one form. A new document moves to its own address once created, replacing the "new"
 * entry in history; the form is keyed by the loaded version, so reloading after a conflict shows the newer copy.
 * 新建与编辑共用一张表单。新文件创建后转到自己的地址，并替换历史记录中的 "新建" 条目；表单以加载到的版本作为 key，
 * 因此冲突后重新加载会显示较新的副本。
 */
export function DocumentEditPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { state, reload } = useLoad(
    () => (documentId ? documentsApi.get(documentId).then((response) => response.document) : Promise.resolve(null)),
    [documentId],
  );

  return (
    <>
      <PageHeader title={documentId ? '编辑公开文件' : '上传公开文件'} back={{ to: '/documents', label: '返回公开文件' }} />
      {state.status === 'loading' && <Spinner label="正在加载文件" />}
      {state.status === 'error' && <LoadFailedNotice title="无法加载这份文件" error={state.error} onRetry={reload} />}
      {state.status === 'ready' && (
        <DocumentForm
          key={state.data?.updatedAt ?? 'new'}
          document={state.data}
          onCreated={(created) => navigate(`/documents/${encodeURIComponent(created.id)}`, { replace: true, state: withNotice('公开文件已创建') })}
          onDeleted={() => navigate('/documents', { replace: true })}
          onReload={reload}
        />
      )}
    </>
  );
}
