import { Webhook } from 'svix';

export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const rawBody = await getRawBody(req);

  const svixHeaders = {
    'svix-id':        req.headers['svix-id'],
    'svix-timestamp': req.headers['svix-timestamp'],
    'svix-signature': req.headers['svix-signature'],
  };

  let event;
  try {
    event = new Webhook(secret).verify(rawBody, svixHeaders);
  } catch (err) {
    console.warn('[resend-webhook] invalid signature:', err.message);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { type, data } = event;
  const id = data?.email_id ?? data?.id ?? 'unknown';
  const ts = data?.created_at ?? new Date().toISOString();
  const to = data?.to?.[0] ?? data?.to ?? 'unknown';

  switch (type) {
    case 'email.delivered':
      console.log(`[resend] delivered  | id=${id} to=${to} at=${ts}`);
      break;
    case 'email.opened':
      console.log(`[resend] opened     | id=${id} to=${to} at=${ts}`);
      break;
    case 'email.clicked':
      console.log(`[resend] clicked    | id=${id} to=${to} url=${data?.click?.link ?? 'unknown'} at=${ts}`);
      break;
    case 'email.bounced':
      console.log(`[resend] bounced    | id=${id} to=${to} reason=${data?.bounce?.message ?? 'unknown'} at=${ts}`);
      break;
    default:
      console.log(`[resend] unhandled  | type=${type} id=${id} at=${ts}`);
  }

  return res.status(200).json({ received: true });
}
