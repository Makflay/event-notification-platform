import { Module } from '@nestjs/common';
import { TelegramNotifierModule } from '@app/telegram-notifier';
import { QueueListenerService } from './queue-listener.service';
import { EventHandlerService } from '../application/event-handler.service';
import { ProcessedEventsStore } from '../application/processed-events.store';

@Module({
  imports: [TelegramNotifierModule],
  providers: [QueueListenerService, EventHandlerService, ProcessedEventsStore],
})
export class RabbitMqModule {}
