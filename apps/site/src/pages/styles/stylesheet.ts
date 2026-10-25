import { SITE_CSS } from './site-css';

/**
 * The stylesheet is served at a path that contains a hash of its content, so it can be cached for a year and a
 * deploy that changes it is picked up at once. FNV-1a is enough: the hash only has to change when the text does.
 * 样式表的路径包含其内容的哈希值，因此可以缓存一年，而修改样式的部署会立即生效。FNV-1a 已足够：只要文字变化，哈希就会变化。
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const STYLESHEET_HASH = fnv1a(SITE_CSS);

export const STYLESHEET_PATH = `/static/site-${STYLESHEET_HASH}.css`;

export { SITE_CSS };
