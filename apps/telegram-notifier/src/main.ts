import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Telegram Notifier Service API')
    .setDescription('HTTP API for sending Telegram notifications')
    .setVersion('1.0')
    .addTag('telegram-notifications')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error('Failed to bootstrap telegram-notifier', error);
  process.exit(1);
});
