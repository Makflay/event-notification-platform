import { registerAs } from '@nestjs/config';
import { validateConsumerEnv } from './consumer-env.validation';

export default registerAs('consumer', () => {
  const env = validateConsumerEnv(process.env);

  return {
    port: env.CONSUMER_PORT,
    rabbitmq: {
      url: env.RABBITMQ_URL,
      queue: env.RABBITMQ_QUEUE,
      consumerRetryAttempts: env.RABBITMQ_CONSUMER_RETRY_ATTEMPTS,
      dlxExchange: env.RABBITMQ_DLX_EXCHANGE,
      dlq: env.RABBITMQ_DLQ,
    },
  };
});
