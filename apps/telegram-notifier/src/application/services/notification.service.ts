import {
  Injectable,
  Logger,
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramApiClient } from '../../infrastructure/telegram-api.client';
import { TelegramApiError } from '../../infrastructure/telegram-api.error';
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

    try {
      await this.telegramApiClient.sendMessage(message);
      this.logger.log('Notification sent successfully');

      return {
        status: 'sent',
      };
    } catch (error) {
      if (error instanceof TelegramApiError) {
        this.handleTelegramApiError(error);
      }

      throw error;
    }
  }

  private handleTelegramApiError(error: TelegramApiError): never {
    switch (error.code) {
      case 'INVALID_BOT_TOKEN':
        throw new UnauthorizedException('Telegram bot token is invalid');

      case 'INVALID_CHAT_ID':
        throw new BadRequestException('Telegram chat id is invalid');

      case 'TELEGRAM_TIMEOUT_ERROR':
      case 'TELEGRAM_NETWORK_ERROR':
        throw new ServiceUnavailableException('Telegram API is unavailable');

      case 'TELEGRAM_API_ERROR':
      default:
        throw new BadGatewayException('Telegram API returned an error');
    }
  }
}
