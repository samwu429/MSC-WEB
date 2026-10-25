-- Each Presidium office and each Department Head has at most one visible holder (constitution Articles 4.1, 4.2 and
-- 5.6). The admin API checks this before saving; the index also holds when two saves arrive at the same moment.
-- 每个主席团职位与每个部门的部长最多只有一位正在显示的担任者（章程第 4.1、4.2 与 5.6 条）。后台接口在保存前会检查这一点；
-- 该索引在两次保存同时到达时也能保证这一点。
CREATE UNIQUE INDEX people_single_holder ON people (position, COALESCE(department, ''))
  WHERE visible = 1 AND position NOT IN ('vice_head', 'advisor');
