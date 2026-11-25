type AddressRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AddressRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Addresses are stored as a JSON array of address objects (the legacy `enderecos` rows).
 * The web clients built for the Express/Prisma API still send Prisma nested writes:
 *   { create: {...} }  or  { update: { where: { id_endereco }, data: {...} } }
 * This turns those payloads into the stored array shape; any other value is kept as-is.
 */
export function normalizeAddresses(incoming: unknown, current: unknown): unknown {
  if (!isRecord(incoming)) return incoming;

  const existing = Array.isArray(current) ? current.filter(isRecord) : [];

  if (isRecord(incoming.create)) {
    const nextId =
      existing.reduce((max, address) => Math.max(max, Number(address.id_endereco) || 0), 0) + 1;
    // The newest address becomes the main (first) one.
    return [{ id_endereco: nextId, ...incoming.create }, ...existing];
  }

  if (isRecord(incoming.update)) {
    const update = incoming.update;
    const data = isRecord(update.data) ? update.data : {};
    const targetId = isRecord(update.where) ? Number(update.where.id_endereco) : NaN;
    const index = existing.findIndex((address) => Number(address.id_endereco) === targetId);

    if (index >= 0) {
      const copy = [...existing];
      copy[index] = { ...existing[index], ...data };
      return copy;
    }
    // Unknown id: treat the update as the main (first) address.
    return [
      { id_endereco: Number(existing[0]?.id_endereco) || 1, ...existing[0], ...data },
      ...existing.slice(1),
    ];
  }

  // A single plain address object becomes a one-item list.
  return [incoming];
}
