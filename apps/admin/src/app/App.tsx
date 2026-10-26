import type { ReactNode } from 'react';
import { Navigate, Route, RouterProvider, Routes, createBrowserRouter } from 'react-router-dom';
import type { SitePermission } from '@msc-web/content';
import { LoginPage } from '../features/auth/LoginPage';
import { SessionUnavailablePage } from '../features/auth/SessionUnavailablePage';
import { ChangesPage } from '../features/dashboard/ChangesPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DocumentEditPage } from '../features/documents/DocumentEditPage';
import { DocumentListPage } from '../features/documents/DocumentListPage';
import { EventEditPage } from '../features/events/EventEditPage';
import { EventListPage } from '../features/events/EventListPage';
import { PeopleListPage } from '../features/people/PeopleListPage';
import { PersonEditPage } from '../features/people/PersonEditPage';
import { CourseEditPage } from '../features/reviews/CourseEditPage';
import { CourseListPage } from '../features/reviews/CourseListPage';
import { SessionEditPage } from '../features/reviews/SessionEditPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SessionProvider, useSession } from '../shared/session/SessionProvider';
import { ConfirmProvider } from '../shared/ui/confirm';
import { EmptyState, Spinner } from '../shared/ui/feedback';
import { AdminShell } from './AdminShell';

function Guard({ permission, children }: { permission: SitePermission; children: ReactNode }) {
  const { can } = useSession();
  if (!can(permission)) return <EmptyState title="你的职位没有这个板块的编辑权限">如需调整，请联系主席或科技部。</EmptyState>;
  return <>{children}</>;
}

/**
 * The screens stay mounted while a session has expired, under a sign-in dialog, so the draft on screen survives.
 * They are keyed by member, so a different officer signing in there starts from fresh screens.
 * 会话过期时页面保持挂载，上方显示登录对话框，屏幕上的草稿因此得以保留。页面以成员为 key，因此在对话框中登录的若是另一位干部，会从全新的页面开始。
 */
function AppRoutes() {
  const { state } = useSession();
  if (state.status === 'checking') return <Spinner label="正在验证登录" />;
  if (state.status === 'unavailable') return <SessionUnavailablePage notice={state.notice} />;
  if (state.status === 'signed-out') return <LoginPage />;
  return (
    <>
      <Routes key={state.identity.memberId}>
        <Route element={<AdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="changes" element={<ChangesPage />} />
          <Route path="settings" element={<Guard permission="settings.edit"><SettingsPage /></Guard>} />
          <Route path="people" element={<Guard permission="people.edit"><PeopleListPage /></Guard>} />
          <Route path="people/new" element={<Guard permission="people.edit"><PersonEditPage /></Guard>} />
          <Route path="people/:personId" element={<Guard permission="people.edit"><PersonEditPage /></Guard>} />
          <Route path="events" element={<Guard permission="events.edit"><EventListPage /></Guard>} />
          <Route path="events/new" element={<Guard permission="events.edit"><EventEditPage /></Guard>} />
          <Route path="events/:eventId" element={<Guard permission="events.edit"><EventEditPage /></Guard>} />
          <Route path="reviews" element={<Guard permission="reviews.edit"><CourseListPage /></Guard>} />
          <Route path="reviews/courses/new" element={<Guard permission="reviews.edit"><CourseEditPage /></Guard>} />
          <Route path="reviews/courses/:courseId" element={<Guard permission="reviews.edit"><CourseEditPage /></Guard>} />
          <Route path="reviews/courses/:courseId/sessions/new" element={<Guard permission="reviews.edit"><SessionEditPage /></Guard>} />
          <Route path="reviews/sessions/:sessionId" element={<Guard permission="reviews.edit"><SessionEditPage /></Guard>} />
          <Route path="documents" element={<Guard permission="documents.edit"><DocumentListPage /></Guard>} />
          <Route path="documents/new" element={<Guard permission="documents.edit"><DocumentEditPage /></Guard>} />
          <Route path="documents/:documentId" element={<Guard permission="documents.edit"><DocumentEditPage /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {state.expired && <LoginPage expired />}
    </>
  );
}

/**
 * Admin routes, relative to /admin/. A data router is used so editing screens can hold a link click while they
 * have unsaved changes; the screens themselves are declared in AppRoutes.
 * 后台路由，相对于 /admin/。使用数据路由器，编辑页面在有未保存的修改时才能拦下链接跳转；页面本身在 AppRoutes 中声明。
 */
const router = createBrowserRouter(
  [
    {
      path: '*',
      element: (
        <SessionProvider>
          <ConfirmProvider>
            <AppRoutes />
          </ConfirmProvider>
        </SessionProvider>
      ),
    },
  ],
  { basename: '/admin', future: { v7_relativeSplatPath: true } },
);

export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
