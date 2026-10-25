/**
 * Editors write plain text: a blank line starts a new paragraph, a single newline is a line break, and web
 * addresses become links. This module only splits the text into that structure; rendering escapes every piece,
 * so editor text can never inject markup.
 * 编辑者撰写纯文本：空行开始新段落，单个换行为换行，网址会变成链接。本模块只负责把文字拆成这种结构；
 * 渲染时会对每一部分进行转义，因此编辑者的文字永远无法注入标记。
 */

export type TextSegment = { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string };

/** A paragraph is a list of lines; a line is a list of segments. */
/** 段落是若干行；每行由若干片段组成。 */
export type Paragraph = TextSegment[][];

const URL_PATTERN = /https?:\/\/[^\s<>"'，。！？；：、（）《》【】]+/g;

/** Punctuation that usually ends a sentence rather than an address. */
/** 通常表示句子结束而不属于网址的标点。 */
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]+$/;

export function splitLinks(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of line.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    let href = match[0];
    const trailing = TRAILING_PUNCTUATION.exec(href)?.[0] ?? '';
    if (trailing) href = href.slice(0, -trailing.length);
    if (start > last) segments.push({ kind: 'text', text: line.slice(last, start) });
    segments.push({ kind: 'link', text: href, href });
    last = start + href.length;
  }
  if (last < line.length) segments.push({ kind: 'text', text: line.slice(last) });
  return segments;
}

export function toParagraphs(text: string): Paragraph[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => block.split('\n').map((line) => splitLinks(line.trim())));
}
