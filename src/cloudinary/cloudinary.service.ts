import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const REQUIRED_ENV_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  onModuleInit() {
    const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Cloudinary environment variables missing: ${missing.join(', ')}`);
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  get instance() {
    return cloudinary;
  }

  uploadBuffer(buffer: Buffer, options: Record<string, any> = {}): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'suki-doces', ...options },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  async uploadProductImage(buffer?: Buffer): Promise<string | null> {
    if (!buffer) {
      return null;
    }

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ecommerce/produtos',
          resource_type: 'image',
          allowed_formats: [
            'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'heic', 'tiff', 'bmp', 'ico',
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Erro Cloudinary:', error);
            return reject(error);
          }
          if (!result || !result.secure_url) {
            return reject(new Error('Cloudinary não retornou uma URL válida.'));
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });
  }
}
