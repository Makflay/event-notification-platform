import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_CLIENT } from './rabbitmq.constants';
import { RabbitMqConnection } from './rabbitmq.connection';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: configService.getOrThrow<string>('RABBITMQ_QUEUE'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [RabbitMqConnection],
  exports: [ClientsModule],
})
export class RabbitMqModule {}
