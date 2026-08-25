import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  it('provides secure invitation token defaults', () => {
    const { error, value } = envValidationSchema.validate({
      APP_URL: 'http://localhost:5173',
      POSTGRES_HOST: 'localhost',
      POSTGRES_DB: 'researchtracker',
      POSTGRES_MIGRATION_USER: 'migration-user',
      POSTGRES_MIGRATION_PASSWORD: 'migration-password',
      POSTGRES_RUNTIME_USER: 'runtime-user',
      POSTGRES_RUNTIME_PASSWORD: 'runtime-password',
      MINIO_ENDPOINT: 'http://localhost:9000',
      COGNITO_REGION: 'ap-southeast-2',
      COGNITO_USER_POOL_ID: 'pool-id',
      COGNITO_CLIENT_ID: 'client-id',
      COGNITO_DOMAIN: 'example.auth.ap-southeast-2.amazoncognito.com',
    });

    expect(error).toBeUndefined();
    expect(value.INVITATION_TOKEN_TTL_HOURS).toBe(72);
    expect(value.INVITATION_TOKEN_BYTES).toBe(32);
  });
});
