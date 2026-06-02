import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventDto } from '@app/shared';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';

@Injectable()
export class QueueListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueListenerService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const rabbitmq = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.url',
    );
    const queue = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.queue',
    );

    this.connection = await connect(rabbitmq);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(queue, {
      durable: true,
    });

    await this.channel.consume(
      queue,
      (message) => {
        if (!message) {
          return;
        }
        try {
          const event = this.deserializeMessage(message);
          this.logger.log(`Received event: id=${event.id}, type=${event.type}`);
          this.channel.ack(message);
          this.logger.log(
            `ACK sent for event: id=${event.id}, type=${event.type}`,
          );
        } catch (error) {
          this.logger.error(
            'Failed to parse RabbitMQ message',
            error instanceof Error ? error.stack : undefined,
          );

          this.channel.nack(message, false, true);
        }
      },
      {
        noAck: false,
      },
    );

    this.logger.log(`Listening RabbitMQ queue: ${queue}`);
  }

  private isEventDto(value: unknown): value is EventDto {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const event = value as Partial<EventDto>;

    return (
      typeof event.id === 'string' &&
      typeof event.type === 'string' &&
      typeof event.payload === 'object' &&
      event.payload !== null &&
      typeof event.createdAt === 'string'
    );
  }

  private deserializeMessage(message: ConsumeMessage): EventDto {
    const rawContent = message.content.toString('utf-8');
    const parsed: unknown = JSON.parse(rawContent);

    if (!this.isEventDto(parsed)) {
      throw new Error('Invalid event message structure');
    }

    return parsed;
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
