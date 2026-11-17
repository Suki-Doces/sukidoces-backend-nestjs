export abstract class ErrorReporter {
  abstract capture(error: unknown): void;
}
