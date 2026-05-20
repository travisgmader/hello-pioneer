/**
 * Wave 0 RED stub — ARCH-09 (offline banner UI).
 *
 * The OfflineBanner component is created in Plan 04. Until then this test
 * MUST fail at import time. Asserts that dispatching a `window 'offline'`
 * event surfaces the banner copy required by UI-SPEC §Copywriting Contract.
 */
import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @ts-expect-error — component is created in Plan 04
import { OfflineBanner } from '../../src/components/OfflineBanner';

describe('OfflineBanner (Wave 0 RED stub — created in Plan 04)', () => {
  it('appears when the browser goes offline', () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <OfflineBanner />
      </QueryClientProvider>,
    );
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(
      screen.getByText(/Offline.*changes will sync when reconnected/i),
    ).toBeInTheDocument();
  });
});
