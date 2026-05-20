/**
 * PowerSync backend connector — bridges PowerSync upload queue to Supabase.
 *
 * fetchCredentials: reads the current Supabase session and returns the JWT
 *   access_token plus the PowerSync instance URL (T-01b-I-01: token is read
 *   fresh each time; connector runs as the authenticated user).
 *
 * uploadData: processes CRUD operations from the PowerSync upload queue:
 *   PUT  → upsert with onConflict: 'id' (idempotent, handles offline batching)
 *   PATCH → update matching row by id
 *   DELETE → soft-delete only: sets is_deleted=true (DATA-02, T-01b-T-01)
 *            Never issues a hard-delete SQL statement — required for PowerSync
 *            convergence and for 60-day v1 backup window compliance.
 */

import {
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  type PowerSyncCredentials,
  UpdateType,
} from '@powersync/react-native';
import { supabase } from './supabase';

export class AppConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // No active session — PowerSync will retry after the next auth state change.
      return null;
    }

    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const tx = await database.getNextCrudTransaction();
    if (!tx) return;

    try {
      for (const op of tx.crud) {
        const record = { ...op.opData, id: op.id };

        switch (op.op) {
          case UpdateType.PUT:
            // Upsert — idempotent; handles duplicate uploads from offline batching.
            await supabase.from(op.table).upsert(record, { onConflict: 'id' });
            break;

          case UpdateType.PATCH:
            await supabase.from(op.table).update(record).eq('id', op.id);
            break;

          case UpdateType.DELETE:
            // Soft delete only (DATA-02 / T-01b-T-01).
            // Setting is_deleted=true preserves the row for:
            //   1. PowerSync convergence (hard deletes break WAL replication)
            //   2. The 60-day v1 backup window
            //   3. Analytics and audit trails in future phases
            await supabase
              .from(op.table)
              .update({ is_deleted: true })
              .eq('id', op.id);
            break;
        }
      }

      // Mark the transaction as successfully uploaded so PowerSync removes it
      // from the local upload queue.
      await tx.complete();
    } catch (err) {
      // Do NOT call tx.complete() on error — PowerSync will retry the entire
      // transaction after the configured retry delay (default: 5 seconds).
      throw err;
    }
  }
}
