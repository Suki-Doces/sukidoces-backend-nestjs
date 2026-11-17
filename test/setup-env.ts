// Runs before any test file is imported: the Joi validation in ConfigModule reads
// these variables as soon as AppModule is evaluated.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-integration-1234567890';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-integration-1234567890';
process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/test'; // unused: the database module is replaced
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.BCRYPT_SALT_ROUNDS = '4';
