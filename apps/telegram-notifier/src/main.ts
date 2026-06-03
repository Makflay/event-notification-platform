import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { TelegramNotifierModule } from './telegram-notifier.module';

async function bootstrap() {
  const app = await NestFactory.create(TelegramNotifierModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('telegramNotifier.port');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(port);
}
bootstrap();
