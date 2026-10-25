import { mediaUrl, pickText } from '@msc-web/content';
import { documentsApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { LinkButton, buttonClass } from '../../shared/ui/Button';
import { Badge, EmptyState, Spinner } from '../../shared/ui/feedback';
import { PageHeader, Panel } from '../../shared/ui/layout';
import { groupDocuments } from './list/group-documents';

export function DocumentListPage() {
  const { state, reload } = useLoad(() => documentsApi.list(), []);

  return (
    <>
      <PageHeader
        title="公开文件"
        description="章程、年度公开账目、选举结果、部门大纲与会议记录，显示在公开网站的关于页面。只上传删减后的副本。"
        actions={
          <LinkButton to="/documents/new" variant="primary">
            上传公开文件
          </LinkButton>
        }
      />
      {state.status === 'loading' && <Spinner label="正在加载公开文件" />}
      {state.status === 'error' && <LoadFailedNotice title="无法加载公开文件" error={state.error} onRetry={reload} />}
      {state.status === 'ready' && state.data.documents.length === 0 && (
        <EmptyState title="还没有公开文件">上传章程、年度公开账目等文件后，它们会按类别列在这里。</EmptyState>
      )}
      {state.status === 'ready' && state.data.documents.length > 0 && (
        <div className="space-y-6">
          {groupDocuments(state.data.documents).map((group) => (
            <Panel key={group.category} title={group.label} description={`${group.documents.length} 份文件`}>
              <ul className="-my-3 divide-y divide-line">
                {group.documents.map((document) => {
                  const title = pickText(document.title, 'zh') || '未命名文件';
                  return (
                    <li key={document.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-ink">{title}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          发布日期 <time dateTime={document.publishedOn}>{document.publishedOn}</time>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge tone={document.visible ? 'green' : 'gray'}>{document.visible ? '显示中' : '已隐藏'}</Badge>
                        <a href={mediaUrl(document.mediaKey)} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'sm')}>
                          查看 PDF
                          <span className="sr-only">：{title}（在新标签页中打开）</span>
                        </a>
                        <LinkButton to={`/documents/${encodeURIComponent(document.id)}`} size="sm">
                          编辑
                          <span className="sr-only">：{title}</span>
                        </LinkButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
