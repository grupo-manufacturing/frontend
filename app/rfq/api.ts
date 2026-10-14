const OMS_API_URL = process.env.NEXT_PUBLIC_OMS_API_URL || 'https://oms-backend-pf2e.onrender.com';

export const RFQ_PRODUCTS = [
  'T-shirt',
  'Shirt',
  'Varsity Jacket',
  'Hoodie',
  'Sweatshirt',
  'Acid Wash Tshirts / Hoodies',
  'Cargos / Denim Jeans / Parachute Pants',
  'Jacket [Denim / Leather]',
  'Crop Tops',
  'Wind Cheaters',
  'Caps',
  'Scarfs',
  'Shacket',
  'Women Clothing [Indian]',
  'Women Clothing [Western]',
  'Bags [Laptop, Pouch, Hand bags]',
] as const;

export type RfqProduct = (typeof RFQ_PRODUCTS)[number];

export const RFQ_MIN_QUANTITY = 50;

export type RfqPayload = {
  name: string;
  brandName: string;
  email: string;
  phone: string;
  location: string;
  techPackUrl?: string;
  items: { product: RfqProduct; quantity: number }[];
  website: string;
};

export class RfqSubmitError extends Error {
  constructor(message: string, public details: string[] = []) {
    super(message);
  }
}

export async function submitRfq(payload: RfqPayload): Promise<string | null> {
  const res = await fetch(`${OMS_API_URL}/api/rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429) {
      throw new RfqSubmitError('You\'re submitting too fast. Please wait a minute and try again.');
    }
    const details: string[] = Array.isArray(body.details)
      ? body.details.map((d: string) => d.replace(/^[\w.]+:\s*/, ''))
      : [];
    throw new RfqSubmitError(body.error || 'Failed to submit your request. Please try again.', details);
  }

  return body.rfqNumber ?? null;
}

// The backend sleeps when idle on Render; ping it on page load so it's awake by the time the form is submitted.
export function wakeOmsBackend() {
  fetch(`${OMS_API_URL}/health`).catch(() => {});
}
