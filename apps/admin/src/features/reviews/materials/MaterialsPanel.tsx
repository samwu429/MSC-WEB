import { useCallback, useRef, useState } from 'react';
import { MATERIAL_KIND_LABELS, isSafeHttpUrl, mediaUrl, type ReviewMaterial } from '@msc-web/content';
import { reviewSessionsApi } from '../../../shared/api/endpoints';
import { useFlash } from '../../../shared/feedback/useFlash';
import { errorMessage } from '../../../shared/forms/issues';
import { Button } from '../../../shared/ui/Button';
import { Badge, Notice } from '../../../shared/ui/feedback';
import { Panel } from '../../../shared/ui/layout';
import { MaterialForm } from './MaterialForm';
import { materialListLabel, placeMaterial } from './material-draft';

const LINK_CLASS = 'font-semibold text-brand-700 hover:underline';

function MaterialLink({ material }: { material: ReviewMaterial }) {
  if (material.mediaKey) {
    return (
      <a href={mediaUrl(material.mediaKey)} target="_blank" rel="noreferrer" className={LINK_CLASS}>
        查看 PDF
      </a>
    );
  }
  if (material.url && isSafeHttpUrl(material.url)) {
    return (
      <a href={material.url} target="_blank" rel="noreferrer" title={material.url} className={`inline-block max-w-[15rem] truncate align-bottom sm:max-w-md ${LINK_CLASS}`}>
        {material.url}
      </a>
    );
  }
  return <span>未提供文件或链接</span>;
}

/**
 * The materials of a saved session. Each change is applied to the list at once and the list is then re-read from
 * the server, so materials another officer added also appear, in the server's order.
 * 已保存复习场次的资料。每次修改都会立即反映到列表中，随后再从服务器重新读取列表，其他干部添加的资料因此也会按服务器的顺序出现。
 */
export function MaterialsPanel({ sessionId, initialMaterials, className }: { sessionId: string; initialMaterials: readonly ReviewMaterial[]; className?: string }) {
  const [materials, setMaterials] = useState<readonly ReviewMaterial[]>(initialMaterials);
  const [editing, setEditing] = useState<ReviewMaterial | 'new' | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const { flash, showFlash, clearFlash } = useFlash();
  const refreshGeneration = useRef(0);

  /**
   * A newer refresh always wins over an older one. A failed refresh is ignored, because the list already holds the
   * change that was just saved.
   * 较新的刷新总是优先于较旧的刷新。刷新失败时忽略即可，因为列表中已包含刚刚保存的修改。
   */
  const refresh = useCallback(() => {
    refreshGeneration.current += 1;
    const generation = refreshGeneration.current;
    reviewSessionsApi.get(sessionId).then(
      ({ session }) => {
        if (refreshGeneration.current === generation) setMaterials(session.materials);
      },
      () => undefined,
    );
  }, [sessionId]);

  function open(target: ReviewMaterial | 'new') {
    setEditing(target);
    setError(null);
    clearFlash();
  }

  function saved(material: ReviewMaterial) {
    setMaterials((current) => placeMaterial(current, material));
    setEditing(null);
    showFlash('资料已保存');
    refresh();
  }

  async function remove(material: ReviewMaterial) {
    if (!window.confirm(`确定删除资料“${materialListLabel(material)}”吗？删除后无法恢复。`)) return;
    setRemovingId(material.id);
    setError(null);
    clearFlash();
    try {
      await reviewSessionsApi.removeMaterial(sessionId, material.id);
      setMaterials((current) => current.filter((item) => item.id !== material.id));
      setEditing((current) => (current !== 'new' && current?.id === material.id ? null : current));
      showFlash('资料已删除');
      refresh();
    } catch (failure) {
      setError(failure);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Panel
      title="复习资料"
      description="上传 PDF 或填写链接（例如共享文件夹）。资料应为学习辅助材料，不能是需要评分的课程作业。"
      actions={
        editing === null && (
          <Button size="sm" onClick={() => open('new')}>
            添加资料
          </Button>
        )
      }
      className={className}
    >
      {error !== null && <Notice tone="error">{errorMessage(error)}</Notice>}
      {flash && <Notice tone="success">{flash}</Notice>}
      {materials.length === 0 ? (
        <p className="text-sm text-ink-muted">还没有资料。</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {materials.map((material) => (
            <li key={material.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="purple">{MATERIAL_KIND_LABELS[material.kind].zh}</Badge>
                  <span className="break-words text-sm font-semibold text-ink">{materialListLabel(material)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                  <MaterialLink material={material} />
                  <span>排序 {material.sortOrder}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" onClick={() => open(material)}>
                  编辑
                </Button>
                <Button variant="danger" size="sm" busy={removingId === material.id} disabled={removingId !== null} onClick={() => void remove(material)}>
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing !== null && (
        <MaterialForm
          key={editing === 'new' ? 'new' : editing.id}
          sessionId={sessionId}
          material={editing === 'new' ? null : editing}
          existing={materials}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      )}
    </Panel>
  );
}
