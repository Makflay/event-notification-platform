import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramNotifierService } from './telegram-notifier.service';
import telegramNotifierConfig from './config/telegram-notifier.config';
import { validateTelegramNotifierEnv } from './config/telegram-notifier-env.validation';
import { TelegramApiClient } from './infrastructure/telegram-api.client';
import { NotificationService } from './application/services/notification.service';
import { NotificationTemplateService } from './application/templates/notification-template.service';
import { TelegramNotificationController } from './presentation/controllers/telegram-notification.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [telegramNotifierConfig],
      validate: validateTelegramNotifierEnv,
    }),
  ],
  controllers: [TelegramNotificationController],
  providers: [
    TelegramNotifierService,
    TelegramApiClient,
    NotificationService,
    NotificationTemplateService,
  ],
})
export class TelegramNotifierModule {}
