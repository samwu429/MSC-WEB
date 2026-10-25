-- Content of the public website. Text is stored in both languages (_zh and _en columns); times are Toronto wall
-- time "YYYY-MM-DDTHH:mm"; record timestamps are UTC ISO strings. Every uploaded file has a row in media, and every
-- column that points at an upload references it, so a record can never point at a file that does not exist.
-- 公开网站的内容。文字以两种语言保存（_zh 与 _en 列）；活动时间为多伦多本地时间 "YYYY-MM-DDTHH:mm"；记录时间戳为 UTC ISO 字符串。
-- 每个上传文件在 media 中都有一行，所有指向上传文件的列都引用它，因此记录永远不会指向不存在的文件。

CREATE TABLE media (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'document')),
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  file_name TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX media_created ON media (created_at);

-- One JSON document per key; "site" holds SiteSettings from @msc-web/content.
-- 每个键保存一个 JSON 文档；"site" 保存 @msc-web/content 中的 SiteSettings。
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE people (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL CHECK (section IN ('presidium', 'department', 'advisor')),
  position TEXT NOT NULL CHECK (position IN ('president', 'secretary_general', 'vp_finance', 'vp_audit', 'head', 'vice_head', 'advisor')),
  department TEXT CHECK (department IS NULL OR department IN ('technology', 'academic', 'publicity', 'sponsorship', 'events')),
  name_zh TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  affiliation_zh TEXT NOT NULL DEFAULT '',
  affiliation_en TEXT NOT NULL DEFAULT '',
  bio_zh TEXT NOT NULL DEFAULT '',
  bio_en TEXT NOT NULL DEFAULT '',
  photo_key TEXT REFERENCES media (key),
  email TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX people_photo ON people (photo_key);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('academic', 'extracurricular')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  summary_zh TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL DEFAULT '',
  body_zh TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  location_zh TEXT NOT NULL DEFAULT '',
  location_en TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  cover_key TEXT REFERENCES media (key),
  registration_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX events_public ON events (status, starts_at);
CREATE INDEX events_category ON events (status, category, starts_at);
CREATE INDEX events_cover ON events (cover_key);

CREATE TABLE event_photos (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  media_key TEXT NOT NULL REFERENCES media (key),
  caption_zh TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX event_photos_event ON event_photos (event_id, sort_order);
CREATE INDEX event_photos_media ON event_photos (media_key);

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_zh TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE review_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  exam TEXT NOT NULL CHECK (exam IN ('midterm', 'final')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  ends_at TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('in_person', 'online', 'hybrid')),
  location_zh TEXT NOT NULL DEFAULT '',
  location_en TEXT NOT NULL DEFAULT '',
  presenters TEXT NOT NULL DEFAULT '',
  registration_url TEXT,
  recording_url TEXT,
  notes_zh TEXT NOT NULL DEFAULT '',
  notes_en TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX review_sessions_course ON review_sessions (course_id, term);
CREATE INDEX review_sessions_public ON review_sessions (status, term, starts_at);

CREATE TABLE review_materials (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES review_sessions (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('slides', 'notes', 'practice', 'solutions', 'other')),
  label_zh TEXT NOT NULL DEFAULT '',
  label_en TEXT NOT NULL DEFAULT '',
  media_key TEXT REFERENCES media (key),
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  CHECK ((media_key IS NULL) <> (url IS NULL))
);

CREATE INDEX review_materials_session ON review_materials (session_id, sort_order);
CREATE INDEX review_materials_media ON review_materials (media_key);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('constitution', 'public_accounts', 'election_results', 'department_outlines', 'meeting_records', 'other')),
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  media_key TEXT NOT NULL REFERENCES media (key),
  published_on TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX documents_public ON documents (visible, category, published_on);
CREATE INDEX documents_media ON documents (media_key);

-- Who changed what, so the Presidium can see the history of the public site (Article 11 archives).
-- 记录谁修改了什么，主席团因此可以查看公开网站的修改历史（第 11 条档案）。
CREATE TABLE change_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT ''
);

CREATE INDEX change_log_at ON change_log (at);
