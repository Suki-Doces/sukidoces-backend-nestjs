import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';
import { BadRequestError } from '../../../application/errors/application-errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff',
  'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/heic', 'image/heif', 'image/avif',
];

export const multerOptions: MulterOptions = {
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return callback(null, true);
    return callback(
      new BadRequestError('Invalid image format. Use JPG, JPEG, PNG, WEBP, GIF, BMP, TIFF, SVG, ICO, HEIC, HEIF or AVIF.'),
      false,
    );
  },
};
