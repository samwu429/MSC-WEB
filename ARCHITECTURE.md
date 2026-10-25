# Architecture

MSC-WEB is the public website of UTMMSC at `utmmsc.com`: a home page, events (academic and extracurricular), test reviews (midterm and final, per course and term), Our People (Presidium, Department Leads, Honorary Advisors), an About page with the public records the constitution requires, and an editing backend at `/admin/`.

MSC-WEB 是 UTMMSC 在 `utmmsc.com` 的公开网站：首页、活动（学术活动与课外活动）、考前复习（按课程与学期的期中、期末复习）、我们的团队（主席团、部长团、荣誉顾问）、载有章程要求公开记录的关于页面，以及位于 `/admin/` 的编辑后台。

## Deployment shape

| Part | Runs on | Role |
| --- | --- | --- |
| `apps/site` | Cloudflare Worker `msc-web` | Server-rendered public pages, `/media/*`, the admin JSON API at `/admin/api/*`, and the admin app files at `/admin/`. |
| `apps/admin` | Static files inside `msc-web` | React single-page editing backend. |
| `packages/content` | Imported by both | Content types, bilingual labels, validation, permissions, the admin API contract. |
| D1 `msc-web` | Cloudflare D1 | Settings, people, events, courses, review sessions, materials, documents, media index, change log. |
| R2 `msc-web-media` | Cloudflare R2 | Uploaded photos and PDFs. A bucket of its own, so the site can never read member files. |

`utmmsc.com` itself is held by the member network's front-door Worker (`utmmsc-site` in the UTMMSC repository). It keeps `/UTMMSC/` (member app), `/api/*` (member API) and `/download/*`, and forwards every other path to `msc-web` through a service binding named `WEB`.

`utmmsc.com` 本身由成员网络的入口 Worker（UTMMSC 仓库中的 `utmmsc-site`）持有。它保留 `/UTMMSC/`（成员应用）、`/api/*`（成员接口）与 `/download/*`，并通过名为 `WEB` 的服务绑定把其他所有路径转发给 `msc-web`。

## Who can edit

The site has no accounts of its own. Officers sign in to `/admin/` with their member network account; the Worker checks every admin request against the member API (`/auth/me`, cached for 30 seconds per isolate) and maps the member's role to site permissions with the static table in `packages/content/src/access/site-permissions.ts`. Members without an office are refused. On a local machine, `DEV_ADMIN_TOKEN` in `apps/site/.dev.vars` signs in as a developer, and only for requests to `localhost`.

网站没有自己的账号。干部使用成员网络账号登录 `/admin/`；Worker 对每个后台请求都向成员接口（`/auth/me`，每个隔离实例缓存 30 秒）核验，并用 `packages/content/src/access/site-permissions.ts` 中的静态表把成员身份映射为网站权限。没有职位的成员会被拒绝。在本机上，`apps/site/.dev.vars` 中的 `DEV_ADMIN_TOKEN` 可以开发者身份登录，且只对发往 `localhost` 的请求有效。

## Repository layout

```
packages/content/src
  access/        member network roles, site permission table
  api/           admin API request and response shapes
  documents/ events/ people/ reviews/ settings/   one folder per content type: types, labels, validators
  locale/ media/ publishing/ time/ validation/    shared building blocks
apps/site/src
  http/          Hono app, middleware, request helpers, routes
    routes/admin/<section>/   admin API, one folder per section; guards live in routes/admin/index.ts
    routes/public/            page registration (both languages) and handlers/<page>.tsx
    routes/media|static|seo|admin-app/
  domain/        pure rules (identity mapping, text paragraphs, media sniffing)
  infrastructure/
    d1/          repositories; rows/ maps table rows to content types; public/ holds read queries for pages
    r2/ media/ member-api/
  pages/         server-rendered views (hono/jsx): layout/, components/, i18n/, routing/, styles/, one folder per page
  scheduled/     cron work (daily cleanup of unused uploads)
apps/admin/src
  app/           router and shell
  shared/        api client and endpoints, session, navigation, data loading, feedback notices, form controls, media upload fields
  features/<section>/   one folder per backend section
```

## Rules that hold everywhere

- Text is stored in both languages (`_zh`/`_en` columns, `LocalizedText` in code). Either side may be empty; the site falls back to the other.
  文字以两种语言保存（数据库为 `_zh`/`_en` 列，代码中为 `LocalizedText`）。任意一边都可以为空，网站会改用另一边。
- Event and review times are Toronto wall time `YYYY-MM-DDTHH:mm`, compared as strings against `torontoWallTime(now)`. Record timestamps are UTC ISO strings.
  活动与复习时间为多伦多本地时间 `YYYY-MM-DDTHH:mm`，与 `torontoWallTime(now)` 按字符串比较。记录时间戳为 UTC ISO 字符串。
- Every write validates with the shared validator from `@msc-web/content` and reports all field issues at once (`400 invalid` with `issues`).
  每次写入都使用 `@msc-web/content` 中的共享校验器，并一次报告所有字段问题（`400 invalid`，附 `issues`）。
- Updates of records are optimistic: the client sends the `updatedAt` it loaded; a mismatch answers `409 stale`. `nextVersion()` makes every save's `updatedAt` strictly later. Gallery photos and review materials are small sub-items edited one at a time inside their parent's page; they are saved last-write-wins and never change the parent's version, so editing them never makes the parent form stale.
  记录的更新采用乐观并发：客户端发送其加载时的 `updatedAt`；不一致时返回 `409 stale`。`nextVersion()` 保证每次保存的 `updatedAt` 严格更晚。活动相册中的照片与复习资料是在上级页面中逐条编辑的小条目，按 "最后保存者为准" 保存，且从不改变上级记录的版本，因此编辑它们永远不会让上级表单过期。
- SQL must stay within Cloudflare D1's limits, which plain SQLite in tests does not enforce by default: at most 5 terms in a compound SELECT, LIKE patterns of at most 50 bytes, at most 100 bound parameters, and a per-invocation query budget (50 on the free plan). The D1 test adapter rejects the first three.
  SQL 必须遵守 Cloudflare D1 的限制，测试所用的普通 SQLite 默认不会检查这些限制：复合 SELECT 最多 5 段、LIKE 模式最多 50 字节、绑定参数最多 100 个，以及每次调用的查询次数上限（免费计划为 50）。D1 测试适配器会拒绝前三类违规。
- Every write batches a `change_log` row with it (`changeStatement`), so the dashboard can show who changed what.
  每次写入都在同一批次中写入一条 `change_log` 记录（`changeStatement`），概览页因此能显示谁改了什么。
- Uploads go to R2 under server-generated keys and get a `media` row. Content references media by foreign key; settings reference keys inside JSON. When a save or delete stops using a key, `releaseMedia` removes it if nothing else refers to it, with one guarded statement and one bucket call. A daily cron removes uploads never attached; a file the bucket failed to delete keeps its row, so the cron retries it.
  上传文件以服务器生成的键存入 R2，并在 `media` 表中登记。内容以外键引用媒体；设置在 JSON 中引用键。保存或删除后不再使用某个键时，若没有其他引用，`releaseMedia` 会用一条带条件的语句和一次存储桶调用将其移除。每日定时任务会删除从未被使用的上传；存储桶删除失败的文件会保留其记录，由定时任务重试。
- Public pages run no JavaScript and use only classes from `pages/styles/site-css.ts`; the content security policy forbids scripts and inline styles there. Editor text is rendered through `RichText`, which escapes everything.
  公开页面不运行 JavaScript，只使用 `pages/styles/site-css.ts` 中的类名；那里的内容安全策略禁止脚本和行内样式。编辑者的文字通过 `RichText` 渲染，所有内容都会被转义。
- The footer states that UTMMSC is a student group and not an office of the University (constitution Article 1.3), and the site uses no University marks (Article 1.4).
  页脚说明 UTMMSC 是学生社团，而非学校的办公室（章程第 1.3 条），网站不使用任何学校标志（第 1.4 条）。
