import { Injectable, Logger } from '@nestjs/common';
import { TelegramApiClient } from '../../infrastructure/telegram-api.client';

export interface SendNotificationResult {
  status: 'sent';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly telegramApiClient: TelegramApiClient) {}

  async sendNotification(message: string): Promise<SendNotificationResult> {
    await this.telegramApiClient.sendMessage(message);
    this.logger.log('Notification sent successfully');

    return {
      status: 'sent',
    };
  }
}
