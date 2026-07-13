# Crown Season — Project Instructions

## Working style
- **Never ask me to do anything you can do yourself.** Run the commands, edit the files, apply the migrations, deploy. Only ask when a decision is genuinely mine (product/design choices, or actions that are outward-facing/hard to reverse) or when the action requires credentials/access you don't have. Reviews and deployments may still be handed to me.

## Security — always apply best practices
This app is cloud-backed (Supabase project `mfjkumgpsqtfutmbmzmf`) with member sign-in, per-user data, and leader data. Treat security as a default, not an afterthought:

- **Never commit secrets.** Keep keys in `.env.local` / `.supabase.env` (already gitignored). Never hardcode service-role keys, DB passwords, or private keys in source. Only the Supabase **anon/publishable** key belongs in client code.
- **Row Level Security (RLS) is mandatory** on every table holding user or leader data. Users may only read/write their own rows; leader-only data must be gated behind RLS policies, never client-side checks alone.
- **Service-role key is server-only.** Never ship it to the browser or bundle it into the Vite build.
- **Validate and scope every query.** Rely on RLS + `auth.uid()`, not on trusting client-supplied user IDs.
- **Least privilege** for any new tables, functions, or policies. Prefer `security invoker`; use `security definer` only when required and with a locked `search_path`.
- **Check advisors after schema changes.** Run Supabase security/performance advisors after migrations and fix what they flag.
- **No secrets in logs, screenshots, or commits.** Scrub tokens before pasting output.
- **Keep dependencies current** for security patches when practical.

When in doubt, choose the more secure option and tell me what you did.
