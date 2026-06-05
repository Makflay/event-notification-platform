import { Injectable, Logger } from '@nestjs/common';
import { EventDto, EventType } from '@app/shared';
import { NotificationService } from '@app/telegram-notifier';
import type { TelegramNotificationPayload } from '@app/telegram-notifier';

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger(EventHandlerService.name);

  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: EventDto): Promise<void> {
    switch (event.type) {
      case EventType.SYSTEM_TEST_EVENT:
        this.logger.log(
          `System test event received: ${JSON.stringify(event.payload)}`,
        );
        break;

      case EventType.TELEGRAM_NOTIFICATION_CREATED:
        await this.notificationService.sendNotification(
          this.toTelegramNotificationPayload(event.payload),
        );
        this.logger.log(`Telegram notification sent for event: id=${event.id}`);
        break;

      default:
        this.logger.warn(`Unknown event type received:`);
        break;
    }
  }

  private toTelegramNotificationPayload(
    payload: Record<string, unknown>,
  ): TelegramNotificationPayload {
    const { title, message, metadata } = payload;

    if (
      typeof title !== 'string' ||
      typeof message !== 'string' ||
      !metadata ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata)
    ) {
      throw new Error('Invalid telegram notification payload');
    }

    return {
      title,
      message,
      metadata: metadata as Record<string, unknown>,
    };
  }
}
