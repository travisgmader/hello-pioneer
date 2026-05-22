import { describe, it } from 'vitest';

describe('useRestTimer', () => {
  it.todo('start() schedules notification with TIME_INTERVAL trigger and stores notificationId');
  it.todo('cancel() cancels the scheduled notification and clears remaining');
  it.todo('AppState active recomputes remaining from MMKV timer_start_epoch');
});
