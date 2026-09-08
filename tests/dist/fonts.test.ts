import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('font loading', () => {
  const home = distFile('index.html');

  it('keeps the full Google Fonts request: the hero uses Fraunces italic, and the pizza CTA and blockquotes use Cormorant italic', () => {
    expect(home).toContain('family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&');
    expect(home).toContain('family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600');
  });

  it('does not preload the stale v32 Fraunces file', () => {
    expect(home).not.toContain('fonts.gstatic.com/s/fraunces/v32/');
  });
});
