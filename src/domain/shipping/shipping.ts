/**
 * Shipping rules. Single source of truth: the website, the mobile app and checkout all use this.
 * Origin of every shipment: Diadema - SP.
 *
 * Free shipping is decided on the PRODUCTS subtotal, before any coupon discount.
 */

export interface ShippingDestination {
  /** Two-letter state code (UF), upper case. */
  state: string;
  /** City name, upper case without accents (only relevant for SP). */
  city: string;
}

export type ShippingZone =
  'DIADEMA' | 'SP_METRO' | 'SP_COUNTRYSIDE' | 'SOUTH_SOUTHEAST' | 'NORTH_NORTHEAST_MIDWEST';

export interface ShippingQuote {
  zone: ShippingZone;
  /** Amount to charge (0 when free). */
  amount: number;
  /** Fee for this zone when the order does not qualify for free shipping. */
  standardFee: number;
  freeShipping: boolean;
  /** Products subtotal from which shipping is free in this zone. */
  freeShippingThreshold: number;
}

export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const SP_METRO_CITIES = new Set([
  'SAO PAULO',
  'SAO BERNARDO DO CAMPO',
  'SANTO ANDRE',
  'SAO CAETANO DO SUL',
  'MAUA',
  'RIBEIRAO PIRES',
  'RIO GRANDE DA SERRA',
]);

const SOUTH_SOUTHEAST_STATES = new Set(['RJ', 'MG', 'ES', 'PR', 'SC', 'RS']);

const ZONES: Record<ShippingZone, { fee: number; freeFrom: number }> = {
  DIADEMA: { fee: 5.9, freeFrom: 50 },
  SP_METRO: { fee: 9.9, freeFrom: 100 },
  SP_COUNTRYSIDE: { fee: 16.9, freeFrom: 150 },
  SOUTH_SOUTHEAST: { fee: 24.9, freeFrom: 250 },
  NORTH_NORTHEAST_MIDWEST: { fee: 38.9, freeFrom: 250 },
};

/** Upper case, no accents, single spaces: "São  Paulo " -> "SAO PAULO". */
export function normalizeCity(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Returns a valid destination, or null when the state is unknown or SP has no city. */
export function toShippingDestination(state: unknown, city: unknown): ShippingDestination | null {
  if (typeof state !== 'string') return null;
  const uf = state.trim().toUpperCase();
  if (!(BRAZILIAN_STATES as readonly string[]).includes(uf)) return null;

  const normalizedCity = typeof city === 'string' ? normalizeCity(city) : '';
  // Inside SP the fee depends on the city, so it cannot be guessed.
  if (uf === 'SP' && normalizedCity === '') return null;

  return { state: uf, city: normalizedCity };
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

function zoneOf(destination: ShippingDestination): ShippingZone {
  if (destination.state === 'SP') {
    if (destination.city === 'DIADEMA') return 'DIADEMA';
    return SP_METRO_CITIES.has(destination.city) ? 'SP_METRO' : 'SP_COUNTRYSIDE';
  }
  return SOUTH_SOUTHEAST_STATES.has(destination.state)
    ? 'SOUTH_SOUTHEAST'
    : 'NORTH_NORTHEAST_MIDWEST';
}

export function quoteShipping(
  productsSubtotal: number,
  destination: ShippingDestination,
): ShippingQuote {
  const zone = zoneOf(destination);
  const { fee, freeFrom } = ZONES[zone];
  const subtotal = roundMoney(productsSubtotal);
  // An empty cart has nothing to ship.
  const freeShipping = subtotal > 0 && subtotal >= freeFrom;

  return {
    zone,
    amount: subtotal <= 0 || freeShipping ? 0 : fee,
    standardFee: fee,
    freeShipping,
    freeShippingThreshold: freeFrom,
  };
}
