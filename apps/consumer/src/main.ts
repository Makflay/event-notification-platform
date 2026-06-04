import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ConsumerModule } from './consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(ConsumerModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('consumer.port');

  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error('Failed to bootstrap consumer', error);
  process.exit(1);
});
