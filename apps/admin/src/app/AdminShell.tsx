import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { visibleNavItems } from '../shared/navigation';
import { useSession } from '../shared/session/SessionProvider';

function BookMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 168 132" aria-hidden="true">
      <path d="M 0 132 L 0 6 L 74 30 L 74 132 Z" fill="#5B2A86" />
      <path d="M 94 132 L 94 30 L 168 6 L 168 132 Z" fill="#5B2A86" />
      {[46, 64, 82].map((y) => (
        <g key={y} fill="#FFD23F">
          <rect x="16" y={y} width="40" height="4" />
          <rect x="112" y={y} width="40" height="4" />
        </g>
      ))}
    </svg>
  );
}

/**
 * The signed-in frame: sidebar with the sections this officer may edit, who is signed in, a link to the public
 * site, and sign-out. On phones the sidebar folds into a menu button.
 * 登录后的框架：侧边栏列出该干部可编辑的板块、当前登录者、公开网站链接以及退出按钮。在手机上侧边栏折叠为菜单按钮。
 */
export function AdminShell() {
  const { state, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // A new screen starts at the top, not at the scroll position of the list it was opened from.
  // 新页面从顶部开始显示，而不是停留在打开它的列表的滚动位置。
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (state.status !== 'signed-in') return null;
  const { identity, source } = state;
  const items = visibleNavItems(identity.permissions);

  const nav = (
    <nav className="space-y-1" aria-label="后台导航">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `block rounded-lg px-3 py-2.5 transition-colors ${isActive ? 'bg-brand-800 text-white' : 'text-ink-soft hover:bg-brand-50 hover:text-brand-800'}`
          }
        >
          {({ isActive }) => (
            <>
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className={`block text-xs ${isActive ? 'text-brand-100' : 'text-ink-muted'}`}>{item.description}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <a href="/" className="flex items-center gap-3" title="打开公开网站">
            <BookMark className="h-8 w-10" />
            <span className="leading-tight">
              <span className="block text-lg font-bold text-brand-900">UTMMSC</span>
              <span className="block text-xs text-ink-muted">官网后台</span>
            </span>
          </a>
          <button type="button" className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-semibold text-brand-800 lg:hidden" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            菜单
          </button>
        </div>
        <div className={`${open ? 'block' : 'hidden'} px-3 pb-4 lg:block lg:flex-1 lg:overflow-y-auto`}>{nav}</div>
        <div className={`${open ? 'block' : 'hidden'} border-t border-line px-5 py-4 lg:block`}>
          <p className="truncate text-sm font-semibold text-ink">{identity.displayName || '未命名成员'}</p>
          <p className="text-xs text-ink-muted">
            {identity.roleLabel.zh}
            {source === 'member-app' && ' · 使用成员网络登录'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50">
              查看网站
            </a>
            <button type="button" onClick={() => void signOut()} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-canvas hover:text-ink">
              退出后台
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
