import { Injectable } from '@nestjs/common';
import { ShippingDestination, toShippingDestination } from '@domain/shipping';
import { UserRepository } from '@domain/repositories';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** What a client may send to say where the order goes. */
export interface DestinationInput {
  state?: string | null;
  city?: string | null;
}

/**
 * Reads the destination from the user's saved addresses (JSON in `usuario.enderecos`).
 * The first address is the main one. Two stored shapes exist:
 *   - objects:       { cep, logradouro, ..., cidade, estado }
 *   - legacy arrays: [cep, rua, numero, complemento, bairro, "Cidade - UF"]
 */
export function destinationFromAddresses(addresses: unknown): ShippingDestination | null {
  let list: unknown = addresses;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return null;
    }
  }
  if (isRecord(list)) list = [list];
  if (!Array.isArray(list) || list.length === 0) return null;

  const main = list[0];
  if (isRecord(main)) {
    return toShippingDestination(main.estado ?? main.state, main.cidade ?? main.city);
  }
  if (typeof main === 'string') {
    // Legacy flat list of strings: the sixth item is "Cidade - UF".
    const [city, state] = String(list[5] ?? '').split(' - ');
    return toShippingDestination(state, city);
  }
  return null;
}

@Injectable()
export class ShippingDestinationResolver {
  constructor(private readonly users: UserRepository) {}

  /**
   * - Destination sent by the client (state + city) wins. Returns `invalid` when it was sent but is unusable.
   * - Otherwise the user's main saved address is used.
   * - `missing` when there is nothing to go by.
   */
  async resolve(
    userId: number,
    input?: DestinationInput,
  ): Promise<
    | { status: 'ok'; destination: ShippingDestination }
    | { status: 'invalid' }
    | { status: 'missing' }
  > {
    const sent = Boolean(input?.state?.trim() || input?.city?.trim());
    if (sent) {
      const destination = toShippingDestination(input?.state, input?.city);
      return destination ? { status: 'ok', destination } : { status: 'invalid' };
    }

    const user = await this.users.findById(userId);
    const saved = destinationFromAddresses(user?.addresses);
    return saved ? { status: 'ok', destination: saved } : { status: 'missing' };
  }
}
