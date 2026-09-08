import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('font loading', () => {
  const home = distFile('index.html');

  it('requests Cormorant Garamond at regular weight only', () => {
    expect(home).toContain('family=Cormorant+Garamond:wght@400&');
    expect(home).not.toContain('Cormorant+Garamond:ital');
  });

  it('does not request Fraunces italics', () => {
    expect(home).not.toContain('Fraunces:ital');
    expect(home).toContain('family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700');
  });

  it('does not preload the stale v32 Fraunces file', () => {
    expect(home).not.toContain('fonts.gstatic.com/s/fraunces/v32/');
  });
});
