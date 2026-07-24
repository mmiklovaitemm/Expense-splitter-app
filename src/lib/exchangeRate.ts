import { prisma } from "./prisma";
import { isZeroDecimal } from "./money";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_API = "https://open.er-api.com/v6/latest"; // no key required, used if no API key configured

interface RatesResponse {
  base: string;
  rates: Record<string, number>;
}

async function fetchLiveRates(base: string): Promise<Record<string, number>> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
    : `${FALLBACK_API}/${base}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const data = await res.json();

  const rates = apiKey ? data.conversion_rates : data.rates;
  if (!rates) throw new Error("Exchange rate API returned no rates");
  return rates;
}

/** Returns a rates table for `base`, using a DB cache to avoid hammering the API. */
export async function getRates(base: string): Promise<RatesResponse> {
  const cached = await prisma.exchangeRateCache.findFirst({
    where: { base },
    orderBy: { fetchedAt: "desc" },
  });

  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return { base, rates: JSON.parse(cached.rates) };
  }

  try {
    const rates = await fetchLiveRates(base);
    await prisma.exchangeRateCache.create({
      data: { base, rates: JSON.stringify(rates) },
    });
    return { base, rates };
  } catch (err) {
    if (cached) {
      // Serve stale cache rather than fail the request outright.
      return { base, rates: JSON.parse(cached.rates) };
    }
    throw err;
  }
}

export async function convertAmount(
  amountMinor: number,
  from: string,
  to: string
): Promise<{ convertedMinor: number; rate: number }> {
  if (from === to) return { convertedMinor: amountMinor, rate: 1 };

  const { rates } = await getRates(from);
  const rate = rates[to];
  if (!rate) throw new Error(`No exchange rate available for ${from} -> ${to}`);

  // `rate` converts one major unit of `from` to major units of `to`. Amounts
  // are stored in minor units, and currencies differ in how many minor units
  // make up a major unit (e.g. JPY has none), so rescale explicitly rather
  // than applying the rate directly to minor-unit amounts.
  const fromScale = isZeroDecimal(from) ? 1 : 100;
  const toScale = isZeroDecimal(to) ? 1 : 100;
  const convertedMinor = Math.round(((amountMinor / fromScale) * rate) * toScale);

  return { convertedMinor, rate };
}
