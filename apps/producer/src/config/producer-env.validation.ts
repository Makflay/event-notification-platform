import { z } from 'zod';

const portSchema =
  process.env.NODE_ENV === 'test'
    ? z.coerce.number().int().nonnegative()
    : z.coerce.number().int().positive();

const producerEnvSchema = z.object({
  PRODUCER_PORT: portSchema.default(3000),
  RABBITMQ_URL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith('amqp://') || value.startsWith('amqps://'),
      'RABBITMQ_URL must start with amqp:// or amqps://',
    ),
  RABBITMQ_QUEUE: z.string().min(1),
  RABBITMQ_PUBLISH_RETRY_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(3),
  RABBITMQ_PUBLISH_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(1000),
});

export function validateProducerEnv(config: Record<string, unknown>) {
  const result = producerEnvSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Producer environment validation failed: ${result.error.message}`,
    );
  }

  return result.data;
}
