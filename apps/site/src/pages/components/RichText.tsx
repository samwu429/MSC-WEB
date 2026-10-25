import { toParagraphs } from '../../domain/text/paragraphs';

/**
 * Editor text as paragraphs with line breaks and links. Every piece is passed to JSX as a string, which escapes it.
 * 将编辑者的文字显示为带换行与链接的段落。每一部分都以字符串交给 JSX，由 JSX 负责转义。
 */
export function RichText({ text, class: className = 'prose', lang }: { text: string; class?: string; lang?: string }) {
  const paragraphs = toParagraphs(text);
  if (paragraphs.length === 0) return null;
  return (
    <div class={className} lang={lang}>
      {paragraphs.map((lines) => (
        <p>
          {lines.map((segments, index) => (
            <>
              {index > 0 && <br />}
              {segments.map((segment) =>
                segment.kind === 'link' ? (
                  <a href={segment.href} rel="noopener noreferrer nofollow" target="_blank">
                    {segment.text}
                  </a>
                ) : (
                  segment.text
                ),
              )}
            </>
          ))}
        </p>
      ))}
    </div>
  );
}
