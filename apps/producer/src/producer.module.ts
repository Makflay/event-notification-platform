import { Module } from '@nestjs/common';
import { ProducerController } from './presentation/producer.controller';
import { ConfigModule } from '@nestjs/config';
import { RabbitMqModule } from './infrastructure/rabbitmq.module';
import producerConfig from './config/producer.config';
import { validateProducerEnv } from './config/producer-env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [producerConfig],
      validate: validateProducerEnv,
    }),
    RabbitMqModule,
  ],
  controllers: [ProducerController],
})
export class ProducerModule {}
