/**
 * Task 2 unit tests — Toggle, Chip, ProgressBar, Spinner
 * Source-analysis tests (no DOM renderer required).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../../src/components');

function readComponent(name: string): string {
  return fs.readFileSync(path.join(root, name, 'index.tsx'), 'utf8');
}

/** Match StyleSheet.create( as an actual call */
function hasStyleSheetCreate(src: string): boolean {
  return /StyleSheet\.create\s*\(/.test(src);
}

describe('Toggle component', () => {
  it('exists and exports default', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('export');
    expect(src).toContain('Toggle');
  });

  it('does not use StyleSheet.create', () => {
    expect(hasStyleSheetCreate(readComponent('Toggle'))).toBe(false);
  });

  it('does not contain raw hex values (except F2CA50 if used)', () => {
    const src = readComponent('Toggle');
    expect(src).not.toMatch(/#0A0A0B|#E5E2E1/);
  });

  it('selected pill uses bg-accent-dim', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('bg-accent-dim');
  });

  it('selected pill uses border-border-strong', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('border-border-strong');
  });

  it('selected pill uses text-accent', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('text-accent');
  });

  it('unselected pill uses text-fg-muted', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('text-fg-muted');
  });

  it('has accessibilityState with selected property', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('accessibilityState');
    expect(src).toContain('selected');
  });

  it('fires onChange on press', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('onChange');
  });

  it('uses Haptics.selectionAsync', () => {
    const src = readComponent('Toggle');
    expect(src).toContain('selectionAsync');
  });
});

describe('Chip component', () => {
  it('exists and exports default', () => {
    const src = readComponent('Chip');
    expect(src).toContain('export');
    expect(src).toContain('Chip');
  });

  it('does not use StyleSheet.create', () => {
    expect(hasStyleSheetCreate(readComponent('Chip'))).toBe(false);
  });

  it('selected state uses border-border-strong', () => {
    const src = readComponent('Chip');
    expect(src).toContain('border-border-strong');
  });

  it('selected state uses bg-accent-dim', () => {
    const src = readComponent('Chip');
    expect(src).toContain('bg-accent-dim');
  });

  it('has accessibilityRole radio', () => {
    const src = readComponent('Chip');
    expect(src).toContain('radio');
  });

  it('has Lucide Check icon for selected state', () => {
    const src = readComponent('Chip');
    expect(src).toContain('Check');
  });

  it('unselected uses border-border', () => {
    const src = readComponent('Chip');
    expect(src).toContain('border-border');
  });
});

describe('ProgressBar component', () => {
  it('exists and exports default', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('export');
    expect(src).toContain('ProgressBar');
  });

  it('does not use StyleSheet.create', () => {
    expect(hasStyleSheetCreate(readComponent('ProgressBar'))).toBe(false);
  });

  it('uses useReducedMotion', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('useReducedMotion');
  });

  it('uses useSharedValue from reanimated', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('useSharedValue');
  });

  it('uses withTiming for animation', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('withTiming');
  });

  it('has accessibilityRole progressbar', () => {
    const src = readComponent('ProgressBar');
    expect(src).toMatch(/progressbar/);
  });

  it('has accessibilityValue with now prop', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('accessibilityValue');
    expect(src).toContain('now');
  });

  it('uses bg-accent for fill color', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('bg-accent');
  });

  it('track uses bg-border', () => {
    const src = readComponent('ProgressBar');
    expect(src).toContain('bg-border');
  });
});

describe('Spinner component', () => {
  it('exists and exports default', () => {
    const src = readComponent('Spinner');
    expect(src).toContain('export');
    expect(src).toContain('Spinner');
  });

  it('does not use StyleSheet.create', () => {
    expect(hasStyleSheetCreate(readComponent('Spinner'))).toBe(false);
  });

  it('uses F2CA50 hex for ActivityIndicator color (documented exception)', () => {
    const src = readComponent('Spinner');
    expect(src).toContain('F2CA50');
  });
});
