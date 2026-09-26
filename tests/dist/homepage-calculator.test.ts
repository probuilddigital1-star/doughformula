import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

const home = distFile('index.html');

describe('homepage Advanced Options', () => {
  it('is expanded by default in the server HTML', () => {
    const trigger = home.match(/<button[^>]*id="advanced-trigger"[^>]*>/)![0];
    expect(trigger).toContain('aria-expanded="true"');
    expect(trigger).toContain('aria-controls="advanced-content"');
    const content = home.match(/<div[^>]*id="advanced-content"[^>]*>/)![0];
    expect(content).not.toMatch(/\bhidden\b/);
    const chevron = home.match(/<svg[^>]*id="advanced-chevron"[^>]*>/)![0];
    expect(chevron).toMatch(/style="transform:\s*rotate\(180deg\)"/);
  });

  it('shows the Basics tab first', () => {
    const content = home.slice(home.indexOf('id="advanced-content"'));
    expect(content).toMatch(/class="advanced-tab advanced-tab-active" data-tab="basics"/);
  });
});
