import { describe, expect, it } from 'vitest';
import { pickText } from '../locale/locale';
import { materialLabel } from './material';

describe('materialLabel', () => {
  it('shows a label filled in one language on both sites', () => {
    const label = materialLabel({ kind: 'slides', label: { zh: '', en: 'Week 1-5 slides' } });
    expect(pickText(label, 'zh')).toBe('Week 1-5 slides');
    expect(pickText(label, 'en')).toBe('Week 1-5 slides');
  });

  it('keeps each language when both are filled', () => {
    const label = materialLabel({ kind: 'practice', label: { zh: '2023 期中练习', en: '2023 Practice Midterm' } });
    expect(label).toEqual({ zh: '2023 期中练习', en: '2023 Practice Midterm' });
  });

  it('uses the kind label when no label is given', () => {
    expect(materialLabel({ kind: 'practice', label: { zh: ' ', en: '' } })).toEqual({ zh: '练习题', en: 'Practice problems' });
  });
});
