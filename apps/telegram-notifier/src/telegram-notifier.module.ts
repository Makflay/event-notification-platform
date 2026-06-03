import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramNotifierController } from './telegram-notifier.controller';
import { TelegramNotifierService } from './telegram-notifier.service';
import telegramNotifierConfig from './config/telegram-notifier.config';
import { validateTelegramNotifierEnv } from './config/telegram-notifier-env.validation';
import { TelegramApiClient } from './infrastructure/telegram-api.client';
import { NotificationService } from './application/services/notification.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [telegramNotifierConfig],
      validate: validateTelegramNotifierEnv,
    }),
  ],
  controllers: [TelegramNotifierController],
  providers: [TelegramNotifierService, TelegramApiClient, NotificationService],
})
export class TelegramNotifierModule {}
