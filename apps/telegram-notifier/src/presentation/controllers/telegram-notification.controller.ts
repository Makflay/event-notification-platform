import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from '../../application/services/notification.service';
import { SendTelegramNotificationDto } from '../dto/send-telegram-notification.dto';

@Controller('notifications/telegram')
export class TelegramNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async sendTelegramNotification(
    @Body() payload: SendTelegramNotificationDto,
  ): Promise<{ status: string; provider: string }> {
    const result = await this.notificationService.sendNotification(payload);

    return {
      status: result.status,
      provider: 'telegram',
    };
  }
}
