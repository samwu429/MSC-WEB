import { DEPARTMENT_LABELS, PRESIDIUM_POSITION_LABELS } from '@msc-web/content';
import { peopleApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { LinkButton } from '../../shared/ui/Button';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader, Panel } from '../../shared/ui/layout';
import { OfficeSlot, PersonRows } from './board/OfficeSlot';
import { buildPeopleBoard } from './board/people-board';
import { newPersonPath } from './form/person-form';

const ADVISOR_PATH = newPersonPath({ section: 'advisor', position: 'advisor', department: null });

/**
 * Our People as the public page arranges it, with every office listed even when vacant so the editor sees at a
 * glance which positions still need someone.
 * 按公开页面的结构排列 "我们的团队"，空缺的职位同样列出，编辑者一眼就能看出哪些职位仍需人选。
 */
export function PeopleListPage() {
  const { state, reload } = useLoad(() => peopleApi.list().then(({ people }) => buildPeopleBoard(people)), []);

  return (
    <>
      <PageHeader title="我们的团队" description="按章程列出主席团、部长团与荣誉顾问。网站会列出每个职位，空缺的职位显示为待公布。" />
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <LoadFailedNotice error={state.error} onRetry={reload} />}
      {state.status === 'ready' && (
        <div className="space-y-6">
          <Panel title="主席团" description="每个职位同一时间只有一人显示在网站上。">
            <div className="grid gap-3 md:grid-cols-2">
              {state.data.presidium.map(({ position, people }) => (
                <OfficeSlot
                  key={position}
                  label={PRESIDIUM_POSITION_LABELS[position].zh}
                  addLabel={`添加${PRESIDIUM_POSITION_LABELS[position].zh}`}
                  people={people}
                  addTo={newPersonPath({ section: 'presidium', position, department: null })}
                  emptyLabel="空缺"
                />
              ))}
            </div>
          </Panel>

          <Panel title="部长团" description="每个部门同一时间只有一位部长显示在网站上，副部长可以有多位。">
            {state.data.departments.map(({ department, heads, viceHeads }) => (
              <div key={department}>
                <h3 className="mb-2 text-sm font-bold text-brand-900">{DEPARTMENT_LABELS[department].zh}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <OfficeSlot
                    label="部长"
                    heading="h4"
                    addLabel={`添加${DEPARTMENT_LABELS[department].zh}部长`}
                    people={heads}
                    addTo={newPersonPath({ section: 'department', position: 'head', department })}
                    emptyLabel="空缺"
                  />
                  <OfficeSlot
                    label="副部长"
                    heading="h4"
                    addLabel={`添加${DEPARTMENT_LABELS[department].zh}副部长`}
                    people={viceHeads}
                    addTo={newPersonPath({ section: 'department', position: 'vice_head', department })}
                    emptyLabel="暂无"
                  />
                </div>
              </div>
            ))}
          </Panel>

          <Panel
            title="荣誉顾问"
            actions={
              <LinkButton to={ADVISOR_PATH} size="sm" aria-label="添加荣誉顾问">
                添加
              </LinkButton>
            }
          >
            <div className="overflow-hidden rounded-lg border border-line">
              <PersonRows people={state.data.advisors} emptyLabel="暂无荣誉顾问" />
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
