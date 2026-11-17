export abstract class AppLogger {
  abstract log(message: string): void;
  abstract warn(message: string): void;
  abstract error(message: string, trace?: unknown): void;
}
