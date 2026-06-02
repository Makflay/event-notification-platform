import { Injectable, Logger } from '@nestjs/common';
import { EventDto, EventType } from '@app/shared';

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger(EventHandlerService.name);

  async handle(event: EventDto): Promise<void> {
    switch (event.type) {
      case EventType.SYSTEM_TEST_EVENT:
        this.logger.log(
          `System test event received: ${JSON.stringify(event.payload)}`,
        );
        break;

      case EventType.TELEGRAM_NOTIFICATION_CREATED:
        this.logger.log(
          `Telegram notification event received: id=${event.id}. It will be sent to Telegram later.`,
        );
        break;

      default:
        this.logger.warn(`Unknown event type received:`);
        break;
    }
  }
}
