export abstract class Metrics {
  abstract recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void;
  abstract export(): Promise<string>;
  abstract readonly contentType: string;
}
