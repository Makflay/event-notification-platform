import { Module } from '@nestjs/common';
import { EventPublishService } from './event-publisher.service';
import { EventSerializer } from './event.serializer';

@Module({
  providers: [EventPublishService, EventSerializer],
  exports: [EventPublishService],
})
export class RabbitMqModule {}
