import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelModel, ConfirmChannel, connect } from 'amqplib';
import { EventDto, EventType, generateEventId } from '@app/shared';
import { EventSerializer } from './event.serializer';

@Injectable()
export class EventPublishService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublishService.name);
  private connection!: ChannelModel;
  private channel!: ConfirmChannel;
  private queue!: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventSerializer: EventSerializer,
  ) {}

  async onModuleInit(): Promise<void> {
    const rabbitMqUrl = this.configService.getOrThrow<string>(
      'producer.rabbitmq.url',
    );
    this.queue = this.configService.getOrThrow<string>(
      'producer.rabbitmq.queue',
    );

    this.connection = await connect(rabbitMqUrl);
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.assertQueue(this.queue, {
      durable: true,
    });
    this.logger.log(`RabbitMQ publisher connected. Queue=${this.queue}`);
  }

  async publish(
    type: EventType,
    payload: Record<string, unknown>,
  ): Promise<EventDto> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    const event: EventDto = {
      id: generateEventId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    };

    const serializedEvent = this.eventSerializer.serializeEvent(event);

    try {
      this.channel.sendToQueue(this.queue, serializedEvent, {
        persistent: true,
        contentType: 'application/json',
        headers: {
          eventId: event.id,
          eventType: event.type,
        },
      });

      await this.channel.waitForConfirms();

      this.logger.log(
        `Event published successfully: id=${event.id}, type=(${event.type})`,
      );

      return event;
    } catch (error) {
      this.logger.error(
        `RabbitMQ confirm failed: id=${event.id}, type=${event.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();

    this.logger.log('RabbitMQ publisher connection closed');
  }
}
