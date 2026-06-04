import { z } from 'zod';

const consumerEnvSchema = z.object({
  CONSUMER_PORT: z.coerce.number().int().positive().default(3001),
  RABBITMQ_URL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith('amqp://') || value.startsWith('amqps://'),
      'RABBITMQ_URL must start with amqp:// or amqps://',
    ),
  RABBITMQ_QUEUE: z.string().min(1),
  RABBITMQ_CONSUMER_RETRY_ATTEMPTS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(3),
  RABBITMQ_DLX_EXCHANGE: z.string().min(1).default('events.dlx'),
  RABBITMQ_DLQ: z.string().min(1).default('events.dlq'),
});

export function validateConsumerEnv(config: Record<string, unknown>) {
  const result = consumerEnvSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Consumer environment validation failed: ${result.error.message}`,
    );
  }

  return result.data;
}
