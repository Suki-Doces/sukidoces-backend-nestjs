/** Sales channel where an order was placed. Both channels share the same database and order list. */
export enum OrderOrigin {
  WEB = 'web',
  MOBILE = 'mobile',
}

const ALIASES: Record<string, OrderOrigin> = {
  web: OrderOrigin.WEB,
  site: OrderOrigin.WEB,
  website: OrderOrigin.WEB,
  mobile: OrderOrigin.MOBILE,
  app: OrderOrigin.MOBILE,
  android: OrderOrigin.MOBILE,
  ios: OrderOrigin.MOBILE,
};

/** Maps a free-form client value (e.g. the X-Client-Platform header) to a known channel, or null. */
export function parseOrderOrigin(value: unknown): OrderOrigin | null {
  if (typeof value !== 'string') return null;
  return ALIASES[value.trim().toLowerCase()] ?? null;
}
