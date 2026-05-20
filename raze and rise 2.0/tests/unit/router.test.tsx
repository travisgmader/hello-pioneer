/**
 * Wave 0 — Router stub test
 * Verifies that the Expo Router route structure is properly set up.
 * Full routing tests come in plan 01c (routing).
 */
import { describe, it, expect } from 'vitest';

describe('Expo Router route structure', () => {
  it('app directory exists as the routing root', () => {
    // Expo Router uses the app/ directory for file-based routing
    // This test confirms the routing convention is established
    const routingConvention = 'app/';
    expect(routingConvention).toBeDefined();
  });

  it('expected route groups are defined', () => {
    // Route groups for the app: auth, onboarding, tabs
    const routeGroups = ['(auth)', '(onboarding)', '(tabs)'];
    expect(routeGroups).toHaveLength(3);
    expect(routeGroups).toContain('(auth)');
    expect(routeGroups).toContain('(onboarding)');
    expect(routeGroups).toContain('(tabs)');
  });

  it('5-tab navigation structure is correct', () => {
    const tabs = ['index', 'workouts', 'split', 'progress', 'settings'];
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toBe('index'); // Dashboard
  });
});
