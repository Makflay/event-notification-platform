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
  private publishRetryAttempts!: number;
  private publishRetryDelayMs!: number;

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

    this.publishRetryAttempts = this.configService.getOrThrow<number>(
      'producer.rabbitmq.publishRetryAttempts',
    );

    this.publishRetryDelayMs = this.configService.getOrThrow<number>(
      'producer.rabbitmq.publishRetryDelayMs',
    );
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async sendEventToQueue(
    event: EventDto,
    serializedEvent: Buffer,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    this.channel.sendToQueue(this.queue, serializedEvent, {
      persistent: true,
      contentType: 'application/json',
      headers: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    await this.channel.waitForConfirms();
  }

  async publish(
    type: EventType,
    payload: Record<string, unknown>,
  ): Promise<EventDto> {
    const event: EventDto = {
      id: generateEventId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    };

    const serializedEvent = this.eventSerializer.serializeEvent(event);

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.publishRetryAttempts; attempt += 1) {
      try {
        await this.sendEventToQueue(event, serializedEvent);
        this.logger.log(
          `Event published successfully: id=${event.id}, type=(${event.type})`,
        );

        return event;
      } catch (error) {
        lastError = error;

        this.logger.warn(
          `Failed to publish event: id=${event.id}, type=${event.type}, attempt=${attempt}/${this.publishRetryAttempts}`,
          error instanceof Error ? error.message : String(error),
        );

        if (attempt < this.publishRetryAttempts) {
          await this.delay(this.publishRetryDelayMs);
        }
      }
    }

    this.logger.error(
      `RabbitMQ publish failed after retries: id=${event.id}, type=${event.type}`,
      lastError instanceof Error ? lastError.stack : String(lastError),
    );

    throw lastError instanceof Error
      ? lastError
      : new Error('RabbitMQ publish failed after retries');
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
