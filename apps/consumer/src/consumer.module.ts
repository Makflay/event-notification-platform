import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import consumerConfig from './config/consumer.config';
import { validateConsumerEnv } from './config/consumer-env.validation';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [consumerConfig],
      validate: validateConsumerEnv,
    }),
    RabbitMqModule,
  ],
  controllers: [ConsumerController],
  providers: [ConsumerService],
})
export class ConsumerModule {}
