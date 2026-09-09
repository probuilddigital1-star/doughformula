import { describe, it, expect } from 'vitest';
import { allDistHtml, distFileExists } from './helpers';

const BANNED = ['googlesyndication', 'doubleclick.net', 'googletagservices', 'adsbygoogle', 'Advertisement'];

describe('AdSense removal', () => {
  it('no built page references Google ad infrastructure', () => {
    const offenders: string[] = [];
    for (const { path, html } of allDistHtml()) {
      for (const needle of BANNED) {
        if (html.includes(needle)) offenders.push(`${path}: ${needle}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ads.txt is not published', () => {
    expect(distFileExists('ads.txt')).toBe(false);
  });
});
