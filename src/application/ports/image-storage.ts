export abstract class ImageStorage {
  /** Uploads an image and returns its public URL (or null when there is nothing to upload). */
  abstract upload(buffer?: Buffer): Promise<string | null>;
}
