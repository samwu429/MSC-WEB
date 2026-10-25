/**
 * The RFC 5987 form of a value: UTF-8 percent-encoding that leaves only attr-char unescaped. encodeURIComponent
 * already escapes everything else except ' ( ) *, which are escaped here.
 * 值的 RFC 5987 形式：UTF-8 百分号编码，只保留 attr-char 不转义。encodeURIComponent 已转义其余所有字符，
 * 只有 ' ( ) * 需要在这里另行转义。
 */
function encodeExtValue(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** Shows the file in the browser and names it for saving, in any language, through filename*. */
/** 在浏览器中直接显示文件，并通过 filename* 为保存操作提供任意语言的文件名。 */
export function inlineDisposition(fileName: string): string {
  return `inline; filename*=UTF-8''${encodeExtValue(fileName)}`;
}
