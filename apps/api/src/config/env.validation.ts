import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_MIGRATION_USER: Joi.string().required(),
  POSTGRES_MIGRATION_PASSWORD: Joi.string().required(),
  POSTGRES_RUNTIME_USER: Joi.string().required(),
  POSTGRES_RUNTIME_PASSWORD: Joi.string().required(),
  MINIO_ENDPOINT: Joi.string().required(),
});
