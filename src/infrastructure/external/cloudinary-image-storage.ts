import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ImageStorage } from '../../application/ports/image-storage';
import { AppLogger } from '../../application/ports/app-logger';

const REQUIRED_SETTINGS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

@Injectable()
export class CloudinaryImageStorage extends ImageStorage implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  onModuleInit() {
    const missing = REQUIRED_SETTINGS.filter((name) => !this.config.get(name));
    if (missing.length > 0) {
      throw new Error(`Cloudinary environment variables missing: ${missing.join(', ')}`);
    }

    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  upload(buffer?: Buffer): Promise<string | null> {
    if (!buffer) {
      return Promise.resolve(null);
    }

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'ecommerce/produtos',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'heic', 'tiff', 'bmp', 'ico'],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(error);
          }
          if (!result || !result.secure_url) {
            return reject(new Error('Cloudinary did not return a valid URL.'));
          }
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}
