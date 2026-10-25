-- Sample content for local development only (npm run seed:local in apps/site). Never run against the remote database.
-- Names are placeholders labelled as samples; real people, events and reviews are entered in the admin backend.
-- 仅供本地开发使用的示例内容（在 apps/site 中运行 npm run seed:local）。绝不要在远程数据库上执行。
-- 姓名均为标明 "示例" 的占位内容；真实的成员、活动与复习请在后台录入。

DELETE FROM change_log;
DELETE FROM review_materials;
DELETE FROM review_sessions;
DELETE FROM courses;
DELETE FROM event_photos;
DELETE FROM events;
DELETE FROM people;

INSERT INTO people (id, section, position, department, name_zh, name_en, affiliation_zh, affiliation_en, bio_zh, bio_en, sort_order, visible, created_at, updated_at) VALUES
  ('per_sample_president', 'presidium', 'president', NULL, '示例主席', 'Sample President', '计算机科学 三年级', 'Computer Science, Year 3', '负责联盟的整体运作与对外联络。', 'Leads the Group and represents it on campus.', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('per_sample_secretary', 'presidium', 'secretary_general', NULL, '示例秘书长', 'Sample Secretary-General', '心理学 二年级', 'Psychology, Year 2', '', '', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('per_sample_academic', 'department', 'head', 'academic', '示例学术部长', 'Sample Head of Academic', '数学 三年级', 'Mathematics, Year 3', '组织每学期的期中与期末复习。', 'Runs the midterm and final reviews every term.', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('per_sample_academic_vice', 'department', 'vice_head', 'academic', '示例学术部副部长', 'Sample Vice Head of Academic', '统计学 二年级', 'Statistics, Year 2', '', '', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('per_sample_tech', 'department', 'head', 'technology', '示例科技部长', 'Sample Head of Technology', '计算机科学 三年级', 'Computer Science, Year 3', '', '', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('per_sample_advisor', 'advisor', 'advisor', NULL, '示例荣誉顾问', 'Sample Honorary Advisor', '校友，软件工程师', 'Alumnus, software engineer', '为成员提供职业与学术方面的建议。', 'Offers members career and academic advice.', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z');

INSERT INTO events (id, slug, category, status, title_zh, title_en, summary_zh, summary_en, body_zh, body_en, location_zh, location_en, starts_at, ends_at, registration_url, created_at, updated_at) VALUES
  ('evt_sample_writing', '2026-11-research-writing-workshop', 'academic', 'published', '科研写作工作坊（示例）', 'Research Writing Workshop (sample)', '从选题到文献综述，学术部带你走完一篇课外科研论文的第一步。', 'From choosing a question to a literature review: the first steps of an extracurricular research paper.', '本次工作坊面向所有年级。' || char(10) || char(10) || '我们会讲解如何确定研究问题、如何检索文献，并现场练习写摘要。' || char(10) || '报名：https://example.com/register', 'Open to every year.' || char(10) || char(10) || 'We cover framing a research question and finding literature, then practise writing an abstract together.' || char(10) || 'Register: https://example.com/register', 'DV 2072', 'DV 2072', '2026-11-08T18:00', '2026-11-08T20:00', 'https://example.com/register', '2026-10-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z'),
  ('evt_sample_games', '2026-11-board-game-night', 'extracurricular', 'published', '桌游之夜（示例）', 'Board Game Night (sample)', '期中结束，来放松一下：桌游、零食和新朋友。', 'Midterms are over: board games, snacks and new friends.', '欢迎所有同学参加，不需要任何经验。', 'Everyone is welcome; no experience needed.', '学生中心', 'Student Centre', '2026-11-15T19:00', '2026-11-15T22:00', NULL, '2026-10-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z'),
  ('evt_sample_algorithms', '2026-10-algorithms-and-your-feed', 'academic', 'published', '算法讲座：看不见的信息过滤器（示例）', 'Talk: Algorithms and Your Feed (sample)', '推荐算法如何决定你看到什么？一场面向所有专业的科普讲座。', 'How do recommendation algorithms decide what you see? A talk for every major.', '讲座回顾即将上传。', 'Slides and notes will be posted soon.', 'IB 120', 'IB 120', '2026-10-18T17:00', '2026-10-18T18:30', NULL, '2026-10-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z'),
  ('evt_sample_draft', '2026-12-winter-social', 'extracurricular', 'draft', '冬季联谊（草稿）', 'Winter Social (draft)', '', '', '', '', '', '', '2026-12-12T18:00', NULL, NULL, '2026-10-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z');

INSERT INTO courses (id, code, title_zh, title_en, description_zh, description_en, sort_order, visible, created_at, updated_at) VALUES
  ('crs_sample_csc108', 'CSC108H5', 'Python 编程入门', 'Introduction to Computer Programming', '从变量、条件到函数与列表，覆盖期中与期末的全部考点。', 'Variables, conditionals, functions and lists: every topic on the midterm and final.', 0, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('crs_sample_mat135', 'MAT135H5', '微积分 I', 'Calculus I', '', '', 1, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z'),
  ('crs_sample_psy100', 'PSY100H5', '心理学导论', 'Introductory Psychology', '', '', 2, 1, '2026-09-01T12:00:00.000Z', '2026-09-01T12:00:00.000Z');

INSERT INTO review_sessions (id, course_id, term, exam, status, title_zh, title_en, starts_at, ends_at, mode, location_zh, location_en, presenters, registration_url, recording_url, notes_zh, notes_en, created_at, updated_at) VALUES
  ('rvs_sample_csc108_mid', 'crs_sample_csc108', '2026-fall', 'midterm', 'published', '第 1-5 周', 'Weeks 1-5', '2026-10-10T18:00', '2026-10-10T21:00', 'in_person', 'DV 2072', 'DV 2072', '示例学术部长、示例学术部副部长', NULL, 'https://example.com/recording', '请自带电脑。', 'Bring a laptop.', '2026-09-20T12:00:00.000Z', '2026-09-20T12:00:00.000Z'),
  ('rvs_sample_csc108_final', 'crs_sample_csc108', '2026-fall', 'final', 'published', '', '', '2026-12-05T14:00', '2026-12-05T17:00', 'hybrid', 'DV 2072 与 Zoom', 'DV 2072 and Zoom', '示例学术部长', 'https://example.com/register-final', NULL, '', '', '2026-09-20T12:00:00.000Z', '2026-09-20T12:00:00.000Z'),
  ('rvs_sample_mat135_mid', 'crs_sample_mat135', '2026-fall', 'midterm', 'published', '', '', NULL, NULL, 'in_person', '', '', '', NULL, NULL, '时间确定后会在这里公布。', 'The time will be posted here once confirmed.', '2026-09-20T12:00:00.000Z', '2026-09-20T12:00:00.000Z'),
  ('rvs_sample_psy100_final', 'crs_sample_psy100', '2026-fall', 'final', 'draft', '', '', '2026-12-08T13:00', NULL, 'online', 'Zoom', 'Zoom', '', NULL, NULL, '', '', '2026-09-20T12:00:00.000Z', '2026-09-20T12:00:00.000Z'),
  ('rvs_sample_csc108_winter', 'crs_sample_csc108', '2026-winter', 'final', 'published', '', '', '2026-04-10T18:00', '2026-04-10T21:00', 'in_person', 'IB 110', 'IB 110', '示例学术部长', NULL, NULL, '', '', '2026-03-20T12:00:00.000Z', '2026-03-20T12:00:00.000Z');

INSERT INTO review_materials (id, session_id, kind, label_zh, label_en, media_key, url, sort_order, created_at) VALUES
  ('mat_sample_slides', 'rvs_sample_csc108_mid', 'slides', '期中复习课件', 'Midterm review slides', NULL, 'https://example.com/slides', 0, '2026-10-10T12:00:00.000Z'),
  ('mat_sample_practice', 'rvs_sample_csc108_mid', 'practice', '', '', NULL, 'https://example.com/practice', 1, '2026-10-10T12:00:00.000Z');
