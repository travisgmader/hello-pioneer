// Imported first, and for its side effect: snapshots window.location.hash before
// createClient() below consumes and clears it (detectSessionInUrl). Do not reorder.
import './urlHash.js'

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
