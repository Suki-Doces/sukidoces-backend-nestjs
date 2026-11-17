import { createHash } from 'crypto';
import { RequestHasher } from '../../application/ports';

export class Sha256RequestHasher extends RequestHasher {
  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
