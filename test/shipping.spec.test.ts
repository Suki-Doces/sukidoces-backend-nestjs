import { quoteShipping, toShippingDestination } from '@domain/shipping';
import { destinationFromAddresses } from '@application/shipping';

const quote = (subtotal: number, state: string, city = '') => {
  const destination = toShippingDestination(state, city);
  if (!destination) throw new Error('invalid destination in test');
  return quoteShipping(subtotal, destination);
};

describe('shipping rules (origin: Diadema - SP)', () => {
  it.each([
    // [subtotal, state, city, fee charged, zone]
    [19.8, 'SP', 'Diadema', 5.9, 'DIADEMA'],
    [49.99, 'SP', 'diadema', 5.9, 'DIADEMA'],
    [50, 'SP', 'Diadema', 0, 'DIADEMA'],
    [19.8, 'SP', 'Santo André', 9.9, 'SP_METRO'],
    [19.8, 'sp', 'SAO PAULO', 9.9, 'SP_METRO'],
    [99.99, 'SP', 'São Bernardo do Campo', 9.9, 'SP_METRO'],
    [100, 'SP', 'Mauá', 0, 'SP_METRO'],
    [19.8, 'SP', 'Campinas', 16.9, 'SP_COUNTRYSIDE'],
    [149.99, 'SP', 'Santos', 16.9, 'SP_COUNTRYSIDE'],
    [150, 'SP', 'Santos', 0, 'SP_COUNTRYSIDE'],
    [19.8, 'RJ', 'Niterói', 24.9, 'SOUTH_SOUTHEAST'],
    [249.99, 'RS', '', 24.9, 'SOUTH_SOUTHEAST'],
    [250, 'MG', '', 0, 'SOUTH_SOUTHEAST'],
    [19.8, 'BA', '', 38.9, 'NORTH_NORTHEAST_MIDWEST'],
    [249.99, 'AM', '', 38.9, 'NORTH_NORTHEAST_MIDWEST'],
    [250, 'GO', '', 0, 'NORTH_NORTHEAST_MIDWEST'],
  ])('subtotal %p to %p/%p charges %p (%p)', (subtotal, state, city, fee, zone) => {
    const result = quote(subtotal, state, city);
    expect(result.amount).toBe(fee);
    expect(result.zone).toBe(zone);
    expect(result.freeShipping).toBe(fee === 0);
  });

  it('charges nothing for an empty cart', () => {
    const result = quote(0, 'SP', 'Campinas');
    expect(result.amount).toBe(0);
    expect(result.freeShipping).toBe(false);
  });

  it('rejects unknown states, and SP without a city', () => {
    expect(toShippingDestination('XX', 'Qualquer')).toBeNull();
    expect(toShippingDestination('', 'Diadema')).toBeNull();
    expect(toShippingDestination(undefined, 'Diadema')).toBeNull();
    expect(toShippingDestination('SP', '  ')).toBeNull();
    expect(toShippingDestination('SP', undefined)).toBeNull();
    expect(toShippingDestination('RJ', undefined)).toEqual({ state: 'RJ', city: '' });
  });
});

describe('destinationFromAddresses', () => {
  it('reads the main address in object form', () => {
    expect(
      destinationFromAddresses([
        { cep: '09000-000', cidade: 'Santo André', estado: 'sp' },
        { cidade: 'Recife', estado: 'PE' },
      ]),
    ).toEqual({ state: 'SP', city: 'SANTO ANDRE' });
  });

  it('reads the legacy list-of-strings form and JSON strings', () => {
    const legacy = ['09000-000', 'Rua A', '10', '', 'Centro', 'Diadema - SP'];
    expect(destinationFromAddresses(legacy)).toEqual({ state: 'SP', city: 'DIADEMA' });
    expect(destinationFromAddresses(JSON.stringify(legacy))).toEqual({
      state: 'SP',
      city: 'DIADEMA',
    });
  });

  it('returns null when there is nothing usable', () => {
    expect(destinationFromAddresses(null)).toBeNull();
    expect(destinationFromAddresses([])).toBeNull();
    expect(destinationFromAddresses('not json')).toBeNull();
    expect(destinationFromAddresses([{ cidade: 'Diadema' }])).toBeNull();
    expect(destinationFromAddresses([{ cidade: '', estado: 'SP' }])).toBeNull();
  });
});
