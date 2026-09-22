// Roda ANTES de qualquer arquivo de teste ser importado (via `setupFiles`
// no jest-e2e.json). Necessário porque `import { AppModule }` no topo do
// arquivo de teste é compilado para um `require()` que executa antes de
// qualquer código do próprio arquivo — e `ConfigModule.forRoot({
// validationSchema })` (chamado durante a definição do AppModule) valida
// essas variáveis imediatamente, mesmo que o DatabaseModule real seja
// substituído depois via `.overrideModule()`.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-para-e2e-1234567890';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-para-e2e-1234567890';
process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/test'; // não usado de verdade (DatabaseModule é substituído)
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
