import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TelegramNotifierModule } from './telegram-notifier.module';

async function bootstrap() {
  const app = await NestFactory.create(TelegramNotifierModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('telegramNotifier.port');

  await app.listen(port);
}
bootstrap();
