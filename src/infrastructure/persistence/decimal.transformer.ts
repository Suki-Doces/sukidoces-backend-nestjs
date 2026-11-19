import { ValueTransformer } from 'typeorm';

/** mysql2 returns DECIMAL columns as strings; the domain works with numbers. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
