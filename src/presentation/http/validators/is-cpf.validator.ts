import { registerDecorator, ValidationOptions } from 'class-validator';

function isValidCpf(cpf: string): boolean {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (base: string, factor: number): number => {
    let total = 0;
    for (const digit of base) total += parseInt(digit, 10) * factor--;
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstNine = digits.slice(0, 9);
  const first = checkDigit(firstNine, 10);
  const second = checkDigit(firstNine + first, 11);
  return digits === firstNine + first + second;
}

/** Validates a Brazilian CPF using its check digits (empty values are accepted: combine with IsOptional). */
export function IsCpf(options?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: 'isCpf',
      target: target.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) =>
          value === undefined ||
          value === null ||
          value === '' ||
          (typeof value === 'string' && isValidCpf(value)),
        defaultMessage: () => 'cpf is invalid',
      },
    });
  };
}
