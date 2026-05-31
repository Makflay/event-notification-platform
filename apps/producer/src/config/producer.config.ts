import { registerAs } from '@nestjs/config';
import { validateProducerEnv } from './producer-env.validation';

export default registerAs('producer', () => {
  const env = validateProducerEnv(process.env);

  return {
    port: env.PRODUCER_PORT,
    rabbitmq: {
      url: env.RABBITMQ_URL,
      queue: env.RABBITMQ_QUEUE,
      publishRetryAttempts: env.RABBITMQ_PUBLISH_RETRY_ATTEMPTS,
      publishRetryDelayMs: env.RABBITMQ_PUBLISH_RETRY_DELAY_MS,
    },
  };
});
