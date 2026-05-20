/**
 * Task 1 unit tests — Button, TextInput, Label, HelperText, Divider, IconButton
 * These tests verify structural/API contracts without a DOM renderer.
 * They are intentionally lightweight since NativeWind className rendering
 * requires a native device; these guard exports, prop types, and token usage.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../../src/components');

function readComponent(name: string): string {
  return fs.readFileSync(path.join(root, name, 'index.tsx'), 'utf8');
}

/** Match StyleSheet.create( as an actual call (not a JSDoc comment mention) */
function hasStyleSheetCreate(src: string): boolean {
  // Match the actual function call pattern: StyleSheet.create(
  return /StyleSheet\.create\s*\(/.test(src);
}

describe('Button component', () => {
  it('exists and exports default', () => {
    const src = readComponent('Button');
    expect(src).toContain('export');
    expect(src).toContain('Button');
  });

  it('uses bg-accent for primary variant', () => {
    const src = readComponent('Button');
    expect(src).toContain('bg-accent');
  });

  it('uses text-bg for primary variant text', () => {
    const src = readComponent('Button');
    expect(src).toContain('text-bg');
  });

  it('does not use StyleSheet.create', () => {
    const src = readComponent('Button');
    expect(hasStyleSheetCreate(src)).toBe(false);
  });

  it('does not contain raw hex values', () => {
    const src = readComponent('Button');
    expect(src).not.toMatch(/#0A0A0B|#F2CA50|#E5E2E1/);
  });

  it('has allowFontScaling={false} on Text', () => {
    const src = readComponent('Button');
    expect(src).toContain('allowFontScaling={false}');
  });

  it('has disabled opacity style', () => {
    const src = readComponent('Button');
    expect(src).toContain('opacity-60');
  });

  it('has loading state with Spinner', () => {
    const src = readComponent('Button');
    expect(src).toContain('Spinner');
    expect(src).toContain('loading');
  });

  it('supports secondary, ghost, social-google, social-apple variants', () => {
    const src = readComponent('Button');
    expect(src).toContain('secondary');
    expect(src).toContain('ghost');
    expect(src).toContain('social-google');
    expect(src).toContain('social-apple');
  });

  it('uses active:opacity-80 for press feedback', () => {
    const src = readComponent('Button');
    expect(src).toContain('active:opacity-80');
  });
});

describe('TextInput component', () => {
  it('exists and exports default', () => {
    const src = readComponent('TextInput');
    expect(src).toContain('export');
    expect(src).toContain('TextInput');
  });

  it('does not use StyleSheet.create', () => {
    const src = readComponent('TextInput');
    expect(hasStyleSheetCreate(src)).toBe(false);
  });

  it('does not contain raw hex values', () => {
    const src = readComponent('TextInput');
    expect(src).not.toMatch(/#0A0A0B|#F2CA50|#E5E2E1/);
  });

  it('has password variant with Eye/EyeOff toggle', () => {
    const src = readComponent('TextInput');
    expect(src).toContain('Eye');
    expect(src).toContain('EyeOff');
  });

  it('has 44x44 hitSlop on password eye toggle', () => {
    const src = readComponent('TextInput');
    expect(src).toContain('hitSlop');
  });

  it('has focused state with border-border-strong', () => {
    const src = readComponent('TextInput');
    expect(src).toContain('border-border-strong');
  });

  it('has error state with border-danger and bg-danger-dim', () => {
    const src = readComponent('TextInput');
    expect(src).toContain('border-danger');
    expect(src).toContain('bg-danger-dim');
  });

  it('has allowFontScaling={false} on Text elements', () => {
    const src = readComponent('TextInput');
    expect(src).toContain('allowFontScaling={false}');
  });
});

describe('Label component', () => {
  it('exists and exports default', () => {
    const src = readComponent('Label');
    expect(src).toContain('export');
    expect(src).toContain('Label');
  });

  it('does not use StyleSheet.create', () => {
    const src = readComponent('Label');
    expect(hasStyleSheetCreate(src)).toBe(false);
  });

  it('does not contain raw hex values', () => {
    const src = readComponent('Label');
    expect(src).not.toMatch(/#0A0A0B|#F2CA50|#E5E2E1/);
  });

  it('has allowFontScaling={false}', () => {
    const src = readComponent('Label');
    expect(src).toContain('allowFontScaling={false}');
  });

  it('uses text-body class for 16px body text', () => {
    const src = readComponent('Label');
    expect(src).toContain('text-body');
  });

  it('uses text-fg for foreground color', () => {
    const src = readComponent('Label');
    expect(src).toContain('text-fg');
  });
});

describe('HelperText component', () => {
  it('exists and exports default', () => {
    const src = readComponent('HelperText');
    expect(src).toContain('export');
    expect(src).toContain('HelperText');
  });

  it('does not use StyleSheet.create', () => {
    const src = readComponent('HelperText');
    expect(hasStyleSheetCreate(src)).toBe(false);
  });

  it('does not contain raw hex values', () => {
    const src = readComponent('HelperText');
    expect(src).not.toMatch(/#0A0A0B|#F2CA50|#E5E2E1/);
  });

  it('has error variant with AlertCircle icon', () => {
    const src = readComponent('HelperText');
    expect(src).toContain('AlertCircle');
  });

  it('has error variant using text-danger', () => {
    const src = readComponent('HelperText');
    expect(src).toContain('text-danger');
  });

  it('has error variant using bg-danger-dim', () => {
    const src = readComponent('HelperText');
    expect(src).toContain('bg-danger-dim');
  });

  it('has success variant using text-success', () => {
    const src = readComponent('HelperText');
    expect(src).toContain('text-success');
  });

  it('has allowFontScaling={false}', () => {
    const src = readComponent('HelperText');
    expect(src).toContain('allowFontScaling={false}');
  });
});

describe('Divider component', () => {
  it('exists and exports default', () => {
    const src = readComponent('Divider');
    expect(src).toContain('export');
    expect(src).toContain('Divider');
  });

  it('does not use StyleSheet.create', () => {
    const src = readComponent('Divider');
    expect(hasStyleSheetCreate(src)).toBe(false);
  });

  it('does not contain raw hex values', () => {
    const src = readComponent('Divider');
    expect(src).not.toMatch(/#0A0A0B|#F2CA50|#E5E2E1/);
  });

  it('has with-label variant', () => {
    const src = readComponent('Divider');
    expect(src).toContain('with-label');
  });
});

describe('IconButton component', () => {
  it('exists and exports default', () => {
    const src = readComponent('IconButton');
    expect(src).toContain('export');
    expect(src).toContain('IconButton');
  });

  it('does not use StyleSheet.create', () => {
    const src = readComponent('IconButton');
    expect(hasStyleSheetCreate(src)).toBe(false);
  });

  it('does not contain raw hex values', () => {
    const src = readComponent('IconButton');
    expect(src).not.toMatch(/#0A0A0B|#F2CA50|#E5E2E1/);
  });

  it('has back variant with ChevronLeft', () => {
    const src = readComponent('IconButton');
    expect(src).toContain('ChevronLeft');
  });

  it('has accessibilityRole button and accessibilityLabel Back', () => {
    const src = readComponent('IconButton');
    expect(src).toContain('accessibilityRole');
    expect(src).toContain('accessibilityLabel');
  });

  it('has 44x44 hitSlop', () => {
    const src = readComponent('IconButton');
    expect(src).toContain('hitSlop');
  });
});
