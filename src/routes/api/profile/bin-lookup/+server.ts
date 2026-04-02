import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { matchesArmenianBank } from '$lib/server/armenian-bank-allowlist';

type BinLookupPayload = {
  bin?: string;
  cardNumber?: string;
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  const body = (await request.json().catch(() => null)) as BinLookupPayload | null;
  const source = body?.bin?.trim() || body?.cardNumber?.replace(/\D+/g, '') || '';
  const bin = source.slice(0, 8) || source.slice(0, 6);

  if (!/^\d{6,8}$/.test(bin)) {
    return json(
      {
        error: 'Enter at least the first 6 digits of the card.'
      },
      { status: 400 }
    );
  }

  const response = await fetch(`https://lookup.binlist.net/${bin}`, {
    headers: {
      'Accept-Version': '3'
    }
  }).catch(() => null);

  if (!response) {
    return json(
      {
        error: 'BIN lookup is temporarily unavailable.'
      },
      { status: 503 }
    );
  }

  if (response.status === 404) {
    return json(
      {
        error: 'Card BIN was not found.'
      },
      { status: 404 }
    );
  }

  if (!response.ok) {
    return json(
      {
        error: 'BIN lookup failed.'
      },
      { status: response.status }
    );
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const bank = typeof payload?.bank === 'object' && payload?.bank !== null ? (payload.bank as Record<string, unknown>) : null;
  const country =
    typeof payload?.country === 'object' && payload?.country !== null
      ? (payload.country as Record<string, unknown>)
      : null;

  const bankName = typeof bank?.name === 'string' ? bank.name : null;
  const countryAlpha2 = typeof country?.alpha2 === 'string' ? country.alpha2 : null;
  const countryName = typeof country?.name === 'string' ? country.name : null;
  const isArmenianBank = countryAlpha2 === 'AM' && matchesArmenianBank(bankName);

  return json({
    bin,
    scheme: typeof payload?.scheme === 'string' ? payload.scheme : null,
    cardType: typeof payload?.type === 'string' ? payload.type : null,
    bankName,
    countryAlpha2,
    countryName,
    isArmenianBank,
    bonusEligible: isArmenianBank
  });
};
