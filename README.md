# MSC-WEB

The public website of UTMMSC (Mandarin Scholars Coalition at the University of Toronto Mississauga) at https://utmmsc.com/, with an editing backend for officers.

UTMMSC 国语学者联盟的公开网站（https://utmmsc.com/），附带供干部使用的编辑后台。

## What is on the site

| Page | Address | Content |
| --- | --- | --- |
| Home | `/` | Introduction, upcoming events, this term's test reviews, the Presidium, photos, how to join |
| Events | `/events` | Academic and extracurricular activities, upcoming and past, each with details and a photo gallery |
| Test Reviews | `/reviews` | Midterm and final reviews per course and term, with times, places, registration and materials |
| Our People | `/people` | A hub with a header dropdown to three pages: Presidium (`/people/presidium`), Honorary Advisors (`/people/advisors`), and Department Leads, the Heads and Vice Heads of the five departments (`/people/departments`) |
| About | `/about` | Mission, membership, structure, academic integrity, and the public records the constitution requires |
| Backend | `/admin/` | Editing for all of the above, site copy, contact links and the announcement bar |

Every page exists in Chinese (default) and English (`/en/...`).

每个页面都有中文（默认）与英文（`/en/...`）两个版本。

## Who can edit

Officers sign in to `/admin/` with their member network account (the same email and password as `utmmsc.com/UTMMSC/`). An officer already signed in to the member network in the same browser is let in directly. What each office may edit:

干部使用成员网络账号登录 `/admin/`（与 `utmmsc.com/UTMMSC/` 相同的邮箱和密码）。在同一浏览器中已登录成员网络的干部可以直接进入。各职位可编辑的内容：

| Office | Edits |
| --- | --- |
| President, Secretary-General, Head of Technology, system admin | Everything |
| Head of Academic | Test reviews, events |
| Head of Publicity | Site settings, events |
| Head of Events, Head of Sponsorship | Events |
| VP Finance, VP Supervision & Audit | Public documents |

The table is `packages/content/src/access/site-permissions.ts`. Members without an office cannot open the backend.

## Structure

```
apps/site         Cloudflare Worker msc-web: public pages, media, admin API, admin app files
apps/admin        React editing backend served at /admin/
packages/content  Content types, bilingual labels, validation, permissions, admin API contract
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit together.

## Local development

Requirements: Node 22.5 or newer.

```bash
npm install
cp apps/site/.dev.vars.example apps/site/.dev.vars   # then set DEV_ADMIN_TOKEN to a random string of 24+ characters
npm run migrate:local --workspace apps/site
npm run seed:local --workspace apps/site              # optional sample content
npm run build                                         # builds the admin app into the Worker's assets
npm run dev                                           # http://localhost:8787 and http://localhost:8787/admin/
```

On localhost the sign-in page offers a developer sign-in with `DEV_ADMIN_TOKEN`. For hot reload while working on the backend screens, keep `npm run dev` running and start `npm run dev:admin` (http://localhost:5174/admin/).

在本机上，登录页提供使用 `DEV_ADMIN_TOKEN` 的开发者登录。修改后台界面时如需热更新，请保持 `npm run dev` 运行，并另外启动 `npm run dev:admin`（http://localhost:5174/admin/）。

## First deployment

Run inside `apps/site` after `npx wrangler login` with the account that hosts the UTMMSC Workers:

```bash
npx wrangler d1 create msc-web            # put the printed database_id into apps/site/wrangler.jsonc
npx wrangler r2 bucket create msc-web-media
npm run deploy                            # builds the admin app, applies migrations, deploys msc-web
```

Then deploy the front door from the UTMMSC repository (`npm run deploy:site`). Its `WEB` service binding sends every path the member network does not use (`/`, `/events`, `/admin/` and so on) to `msc-web`; `/UTMMSC/`, `/api/` and `/download/` stay with the member network.

然后在 UTMMSC 仓库中部署入口 Worker（`npm run deploy:site`）。它的 `WEB` 服务绑定会把成员网络不使用的所有路径（`/`、`/events`、`/admin/` 等）交给 `msc-web`；`/UTMMSC/`、`/api/` 与 `/download/` 仍属于成员网络。

Later deployments only need `npm run deploy` in `apps/site`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript across all workspaces |
| `npm run lint` | ESLint across all workspaces |
| `npm run test` | Vitest across all workspaces (D1 tests run on Node's built-in SQLite) |
| `npm run build` | Build the admin app and stage the Worker's static files |
| `npm run dev` | Run the Worker locally with local D1 and R2 |
| `npm run deploy` | Build, migrate the remote database and deploy `msc-web` |
