import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().integer().positive().default(3000),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_MIGRATION_USER: Joi.string().required(),
  POSTGRES_MIGRATION_PASSWORD: Joi.string().required(),
  POSTGRES_RUNTIME_USER: Joi.string().required(),
  POSTGRES_RUNTIME_PASSWORD: Joi.string().required(),
  MINIO_ENDPOINT: Joi.string().required(),

  COGNITO_REGION: Joi.string().required(),
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),

  APP_URL: Joi.string().uri().required(),
  INVITATION_TOKEN_TTL_HOURS: Joi.number().integer().positive().default(72),
  INVITATION_TOKEN_BYTES: Joi.number().integer().min(16).default(32),
});
