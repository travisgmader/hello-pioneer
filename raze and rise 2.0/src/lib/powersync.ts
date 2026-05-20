/**
 * PowerSync database instance — exported as a singleton.
 *
 * IMPORTANT: This module does NOT call powersync.init() or powersync.connect()
 * at module load time. Those calls are made from app/_layout.tsx startup, after
 * initStorage() has completed and the user session is known.
 *
 * Startup sequence (enforced by app/_layout.tsx):
 *   1. await initStorage()           — MMKV + SecureStore hybrid ready
 *   2. (supabase client auto-restores session from MMKV)
 *   3. await powersync.init()        — opens the local SQLite DB
 *   4. await powersync.connect(new AppConnector())  — starts sync stream
 */

import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';

export const powersync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'razeandrise.db',
  },
});
