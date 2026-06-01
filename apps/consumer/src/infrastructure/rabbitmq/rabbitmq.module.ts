import { Module } from '@nestjs/common';
//import { RabbitMqConnection } from './rabbitmq.connection';
import { QueueListenerService } from '../queue-listener.service';

@Module({
  providers: [QueueListenerService],
})
export class RabbitMqModule {}
