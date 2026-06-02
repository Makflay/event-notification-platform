import { Module } from '@nestjs/common';
//import { RabbitMqConnection } from './rabbitmq.connection';
import { QueueListenerService } from '../queue-listener.service';
import { EventHandlerService } from '../../application/event-handler.service';

@Module({
  providers: [QueueListenerService, EventHandlerService],
})
export class RabbitMqModule {}
