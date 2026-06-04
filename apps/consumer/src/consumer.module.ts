import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import consumerConfig from './config/consumer.config';
import { validateConsumerEnv } from './config/consumer-env.validation';
import { RabbitMqModule } from './infrastructure/rabbitmq.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [consumerConfig],
      validate: validateConsumerEnv,
    }),
    RabbitMqModule,
  ],
})
export class ConsumerModule {}
