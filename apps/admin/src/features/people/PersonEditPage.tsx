import { useParams, useSearchParams } from 'react-router-dom';
import { peopleApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { PersonForm } from './form/PersonForm';
import { personDefaultsFromQuery } from './form/person-form';

/**
 * /people/new and /people/:personId. The form is keyed by the loaded version, so reloading after a conflict starts
 * it again from the newest saved record.
 * /people/new 与 /people/:personId。表单以加载到的版本为 key，因此冲突后重新加载会以最新保存的记录重新开始编辑。
 */
export function PersonEditPage() {
  const { personId } = useParams();
  const [searchParams] = useSearchParams();
  const { state, reload } = useLoad(() => (personId ? peopleApi.get(personId).then(({ person }) => person) : Promise.resolve(null)), [personId]);

  return (
    <>
      <PageHeader title={personId ? '编辑成员' : '添加成员'} back={{ to: '/people', label: '返回团队列表' }} />
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <LoadFailedNotice error={state.error} onRetry={reload} />}
      {state.status === 'ready' && (
        <PersonForm
          key={state.data ? `${state.data.id}:${state.data.updatedAt}` : `new:${searchParams.toString()}`}
          person={state.data}
          defaults={personDefaultsFromQuery(searchParams)}
          onReload={reload}
        />
      )}
    </>
  );
}
