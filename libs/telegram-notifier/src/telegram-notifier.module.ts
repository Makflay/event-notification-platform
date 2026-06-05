import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import telegramNotifierConfig from './config/telegram-notifier.config';
import { validateTelegramNotifierEnv } from './config/telegram-notifier-env.validation';
import { TelegramApiClient } from './infrastructure/telegram-api.client';
import { NotificationService } from './application/services/notification.service';
import { NotificationTemplateService } from './application/templates/notification-template.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [telegramNotifierConfig],
      validate: validateTelegramNotifierEnv,
    }),
  ],
  providers: [
    TelegramApiClient,
    NotificationService,
    NotificationTemplateService,
  ],
  exports: [
    TelegramApiClient,
    NotificationService,
    NotificationTemplateService,
  ],
})
export class TelegramNotifierModule {}
