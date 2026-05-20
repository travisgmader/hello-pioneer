/**
 * Wave 0 — NativeWind theme token test
 * Verifies that the tailwind.config.js has the correct design system tokens.
 */
import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require('../../tailwind.config.js');

describe('NativeWind design system tokens', () => {
  const colors = tailwindConfig.theme.extend.colors;

  it('bg.DEFAULT equals #0A0A0B', () => {
    expect(colors.bg.DEFAULT).toBe('#0A0A0B');
  });

  it('bg-elevated is defined', () => {
    expect(colors.bg.elevated).toBe('#141416');
  });

  it('accent.DEFAULT equals #F2CA50', () => {
    expect(colors.accent.DEFAULT).toBe('#F2CA50');
  });

  it('accent.deep equals #D4AF37', () => {
    expect(colors.accent.deep).toBe('#D4AF37');
  });

  it('fg.DEFAULT equals #E5E2E1', () => {
    expect(colors.fg.DEFAULT).toBe('#E5E2E1');
  });

  it('danger.DEFAULT equals #EF4444', () => {
    expect(colors.danger.DEFAULT).toBe('#EF4444');
  });

  it('success.DEFAULT equals #10B981', () => {
    expect(colors.success.DEFAULT).toBe('#10B981');
  });

  it('spacing tokens are defined', () => {
    const spacing = tailwindConfig.theme.extend.spacing;
    expect(spacing.xs).toBeDefined();
    expect(spacing.sm).toBeDefined();
    expect(spacing.md).toBeDefined();
    expect(spacing.lg).toBeDefined();
    expect(spacing.xl).toBeDefined();
    expect(spacing['2xl']).toBeDefined();
    expect(spacing['3xl']).toBeDefined();
  });

  it('border radius tokens are defined', () => {
    const borderRadius = tailwindConfig.theme.extend.borderRadius;
    expect(borderRadius.none).toBeDefined();
    expect(borderRadius.sm).toBeDefined();
    expect(borderRadius.md).toBeDefined();
    expect(borderRadius.lg).toBeDefined();
    expect(borderRadius.full).toBeDefined();
  });
});
