/**
 * Whether a list row matches what was typed in a list's search box: every word typed appears, ignoring case, in
 * one of the row's texts (a title in either language, a course code, a link name). An empty box matches everything.
 * 列表行是否符合列表搜索框中输入的内容：输入的每个词（不区分大小写）都出现在该行的某段文字中（任一语言的标题、课程代码、链接名）。
 * 搜索框为空时全部符合。
 */
export function matchesSearch(query: string, texts: readonly (string | null | undefined)[]): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = texts
    .filter((text): text is string => Boolean(text))
    .join('\n')
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}
