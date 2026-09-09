import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('privacy policy', () => {
  const html = distFile('privacy/index.html');

  it('no longer describes AdSense', () => {
    expect(html).not.toContain('AdSense');
    expect(html).not.toContain('DoubleClick');
    expect(html).not.toContain('advertising providers');
  });

  it('describes the newsletter and Kit', () => {
    expect(html).toContain('<h2>Email newsletter</h2>');
    expect(html).toContain('kit.com');
    expect(html).toContain('unsubscribe link');
  });

  it('describes Amazon Associates', () => {
    expect(html).toContain('<h2>Amazon Associates</h2>');
    expect(html).toContain('Amazon Services LLC Associates Program');
  });
});
