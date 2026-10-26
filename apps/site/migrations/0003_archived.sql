-- Officers can mark an event or a review course as ended. An archived event counts as ended whatever its date; an
-- archived course drops out of the current term and is listed with the other ended courses. Both stay public, in
-- the compact lists at the bottom of their pages.
-- 干部可以把活动或复习课程标记为已结束。已归档的活动无论日期如何都视为已结束；已归档的课程不再出现在当前学期中，
-- 而是与其他已结束的课程列在一起。两者仍然公开，显示在各自页面底部的紧凑列表中。
ALTER TABLE events ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1));
ALTER TABLE courses ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1));
