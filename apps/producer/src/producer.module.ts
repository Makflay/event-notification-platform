import { Module } from '@nestjs/common';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';

import { ConfigModule } from '@nestjs/config';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RabbitMqModule,
  ],
  controllers: [ProducerController],
  providers: [ProducerService],
})
export class ProducerModule {}
