/**
 * RevenueCat Webhook Edge Function
 *
 * Receives RevenueCat server-to-server webhook events and updates
 * family_settings.subscription_status accordingly.
 *
 * Security (T-05-02 equivalent for RevenueCat):
 *   - Verifies the Authorization header matches REVENUECAT_WEBHOOK_AUTH_HEADER
 *     (set via `supabase secrets set REVENUECAT_WEBHOOK_AUTH_HEADER=<secret>`).
 *   - Returns 401 if missing or wrong.
 *
 * The RevenueCat app_user_id is the family UUID — it is set when the user
 * first purchases via the RevenueCat SDK (not during wizard submit).
 *
 * Handled events → subscription_status mappings:
 *   INITIAL_PURCHASE | RENEWAL | PRODUCT_CHANGE → event.type.toLowerCase()
 *   CANCELLATION | EXPIRATION                   → 'canceled'
 *   TRIAL_STARTED                               → 'trialing'
 *
 * Returns 200 for recognized events, 400 for unrecognized.
 *
 * Deploy: supabase functions deploy revenuecat-webhook
 * Secret: supabase secrets set REVENUECAT_WEBHOOK_AUTH_HEADER=<from RevenueCat dashboard>
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const WEBHOOK_AUTH_HEADER = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_HEADER') ?? '';

Deno.serve(async (req: Request) => {
  // 1. Verify Authorization header
  const auth = req.headers.get('authorization');
  if (!auth || auth !== WEBHOOK_AUTH_HEADER) {
    return new Response('unauthorized', { status: 401 });
  }

  // 2. Parse RevenueCat webhook payload
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  // RevenueCat wraps the event in a `event` key
  const event = (payload.event ?? payload) as Record<string, unknown>;
  const eventType = event.type as string | undefined;
  const appUserId = event.app_user_id as string | undefined;

  if (!eventType || !appUserId) {
    return new Response('missing event.type or event.app_user_id', { status: 400 });
  }

  // 3. Map event type to subscription_status
  let status: string;
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
      status = eventType.toLowerCase();
      break;
    case 'CANCELLATION':
    case 'EXPIRATION':
      status = 'canceled';
      break;
    case 'TRIAL_STARTED':
      status = 'trialing';
      break;
    default:
      // Unrecognized event — return 400
      return new Response(`unrecognized event type: ${eventType}`, { status: 400 });
  }

  // 4. Update family_settings via service role (bypasses RLS — safe because
  //    the request is auth-header-verified above)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // appUserId is the family UUID (set via RevenueCat SDK as the app user ID)
  const { error } = await admin
    .from('family_settings')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('family_id', appUserId);

  if (error) {
    console.error('revenuecat-webhook: DB update failed', error);
    return new Response(error.message, { status: 500 });
  }

  console.log(`revenuecat-webhook: ${eventType} → subscription_status=${status} for family ${appUserId}`);
  return new Response('ok', { status: 200 });
});
