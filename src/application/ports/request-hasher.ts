export abstract class RequestHasher {
  abstract hash(value: string): string;
}
