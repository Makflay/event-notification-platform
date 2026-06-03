import { Injectable, Logger } from '@nestjs/common';
import { TelegramApiClient } from '../../infrastructure/telegram-api.client';
import { NotificationTemplateService } from '../templates/notification-template.service';
import type { TelegramNotificationPayload } from '../templates/notification-template.service';

export interface SendNotificationResult {
  status: 'sent';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly telegramApiClient: TelegramApiClient,
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {}

  async sendNotification(
    payload: TelegramNotificationPayload,
  ): Promise<SendNotificationResult> {
    const message =
      this.notificationTemplateService.buildTelegramNotification(payload);

    await this.telegramApiClient.sendMessage(message);
    this.logger.log('Notification sent successfully');

    return {
      status: 'sent',
    };
  }
}
