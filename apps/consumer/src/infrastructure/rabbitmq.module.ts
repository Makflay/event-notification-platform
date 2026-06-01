import { Module } from '@nestjs/common';
import { RabbitMqConnection } from './rabbitmq.connection';

@Module({
  providers: [RabbitMqConnection],
})
export class RabbitMqModule {}
