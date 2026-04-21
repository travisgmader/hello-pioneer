export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body ?? {};
  const emailId = data?.email_id ?? data?.id ?? 'unknown';
  const timestamp = data?.created_at ?? new Date().toISOString();

  console.log('[resend-webhook]', JSON.stringify({ type, emailId, timestamp }));

  return res.status(200).json({ received: true });
}
