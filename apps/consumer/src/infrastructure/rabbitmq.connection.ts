import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

@Injectable()
export class RabbitMqConnection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqConnection.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const rabbitMqUrl = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.url',
    );
    const queue = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.queue',
    );

    this.connection = await connect(rabbitMqUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(queue, {
      durable: true,
    });

    this.logger.log(`Connected to RabbitMQ queue: ${queue}`);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();

      this.logger.log('RabbitMQ publisher connection closed');
    } catch (error) {
      this.logger.warn(
        'Failed to close RabbitMQ publisher connection',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
