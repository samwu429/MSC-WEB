-- Officers can mark an academic event as an interest class: a talk in Mandarin on something many students are
-- curious about, outside any course. It stays an event, listed on the events page as before, and also appears under
-- Academic Activities → Interest Classes. The shared validator allows the mark on academic events only. The pages
-- read interest classes by status, category and start time, which the events_category index already covers.
-- 干部可以把学术活动标记为兴趣课：用中文讲授许多同学感兴趣的知识，不跟随任何课程。它仍是一场活动，照常列在活动页面上，
-- 同时出现在「学术活动 → 兴趣课」中。共享校验器只允许学术活动带有该标记。页面按发布状态、类别与开始时间读取兴趣课，
-- 已有的 events_category 索引足以支持这些查询。
ALTER TABLE events ADD COLUMN interest_class INTEGER NOT NULL DEFAULT 0 CHECK (interest_class IN (0, 1));
