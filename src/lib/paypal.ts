export const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  return data.access_token
}

export async function sendPayouts(payouts: {
  email: string
  amount: number
  riderId: string
}[]): Promise<string> {
  const token = await getAccessToken()

  const items = payouts.map((p) => ({
    recipient_type: 'EMAIL',
    amount: { value: p.amount.toFixed(2), currency: 'EUR' },
    receiver: p.email,
    sender_item_id: p.riderId,
  }))

  const res = await fetch(`${PAYPAL_API}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `ravens_${Date.now()}`,
        email_subject: 'Your Dublin Ravens prize money',
      },
      items,
    }),
  })

  const data = await res.json()
  return data.batch_header.payout_batch_id
}