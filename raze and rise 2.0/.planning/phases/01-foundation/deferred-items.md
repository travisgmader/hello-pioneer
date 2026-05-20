# Deferred Items — Phase 01 Foundation

## Pre-existing TypeScript errors (out-of-scope for 01-auth plan)

### TS2307: Cannot find module 'supabase/starter-templates.json'

- **File:** `app/(onboarding)/template.tsx:22`
- **Error:** `Cannot find module '../../../supabase/starter-templates.json' or its corresponding type declarations.`
- **Origin:** Created by `01-scaffold-routing-PLAN.md` (prior plan). The `starter-templates.json` data file is referenced but has not yet been generated/committed.
- **Impact:** `tsc --noEmit` exits with code 2 due to this error. Not caused by auth plan changes.
- **Resolution:** Will be fixed when the Supabase data seeding step creates `supabase/starter-templates.json`, or when the onboarding plan resolves the import.
