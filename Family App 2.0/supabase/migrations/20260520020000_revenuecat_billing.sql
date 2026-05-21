-- Swap Stripe billing columns for RevenueCat.
-- RevenueCat manages customer records; the app_user_id it assigns maps to our
-- family row. Subscription status is updated by the RevenueCat webhook Edge
-- Function on every subscription lifecycle event.
alter table public.families
  rename column stripe_customer_id to rc_app_user_id;

alter table public.family_settings
  rename column stripe_subscription_status to subscription_status;
