import { Module } from '@nestjs/common';
//import { RabbitMqConnection } from './rabbitmq.connection';
import { QueueListenerService } from '../queue-listener.service';
import { EventHandlerService } from '../../application/event-handler.service';
import { ProcessedEventsStore } from '../../application/processed-events.store';

@Module({
  providers: [QueueListenerService, EventHandlerService, ProcessedEventsStore],
})
export class RabbitMqModule {}
