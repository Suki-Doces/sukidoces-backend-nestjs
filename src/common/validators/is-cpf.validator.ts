import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function isValidCpf(cpf: string): boolean {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (base: string, factor: number): number => {
    let total = 0;
    for (const digit of base) {
      total += parseInt(digit, 10) * factor--;
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstNine = digits.slice(0, 9);
  const digit1 = calcCheckDigit(firstNine, 10);
  const digit2 = calcCheckDigit(firstNine + digit1, 11);

  return digits === firstNine + digit1.toString() + digit2.toString();
}

export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCPF',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === undefined || value === null || value === '') return true;
          return typeof value === 'string' && isValidCpf(value);
        },
        defaultMessage() {
          return 'cpf inválido';
        },
      },
    });
  };
}
