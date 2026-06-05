import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventDto } from '@app/shared';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { EventHandlerService } from '../application/event-handler.service';
import { ProcessedEventsStore } from '../application/processed-events.store';

@Injectable()
export class QueueListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueListenerService.name);
  private connection!: ChannelModel;
  private channel!: Channel;
  private readonly retryCountHeader = 'x-retry-count';

  constructor(
    private readonly configService: ConfigService,
    private readonly eventHandlerService: EventHandlerService,
    private readonly processedEventStore: ProcessedEventsStore,
  ) {}

  async onModuleInit(): Promise<void> {
    const rabbitmq = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.url',
    );
    const queue = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.queue',
    );

    this.connection = await connect(rabbitmq);
    this.channel = await this.connection.createChannel();

    await this.setupQueues();

    await this.channel.consume(
      queue,
      (message) => {
        void this.handleMessage(message);
      },
      {
        noAck: false,
      },
    );

    this.logger.log(`Listening RabbitMQ queue: ${queue}`);
  }

  private async setupQueues(): Promise<void> {
    const queue = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.queue',
    );
    const dlxExchange = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.dlxExchange',
    );
    const dlq = this.configService.getOrThrow<string>('consumer.rabbitmq.dlq');

    await this.channel.assertExchange(dlxExchange, 'direct', {
      durable: true,
    });

    await this.channel.assertQueue(dlq, {
      durable: true,
    });

    await this.channel.bindQueue(dlq, dlxExchange, dlq);

    await this.channel.assertQueue(queue, {
      durable: true,
    });
  }

  private publishToDlq(
    message: ConsumeMessage,
    event: EventDto,
    reason: string,
  ): void {
    const dlxExchange = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.dlxExchange',
    );
    const dlq = this.configService.getOrThrow<string>('consumer.rabbitmq.dlq');
    const contentType: unknown = message.properties.contentType;
    this.channel.publish(dlxExchange, dlq, message.content, {
      contentType:
        typeof contentType === 'string' ? contentType : 'application/json',
      persistent: true,
      headers: {
        ...message.properties.headers,
        eventId: event.id,
        eventType: event.type,
        deadLetterReason: reason,
        deadLetteredAt: new Date().toISOString(),
      },
    });

    this.logger.error(
      `Event sent to DLQ: id=${event.id}, type=${event.type}, reason=${reason}`,
    );
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }
    let event: EventDto | null = null;
    try {
      event = this.deserializeMessage(message);
      this.logger.log(`Received event: id=${event.id}, type=${event.type}`);
    } catch (error) {
      this.logger.error(
        'Failed to deserialize RabbitMQ message. Message will be ACKed without requeue.',
        error instanceof Error ? error.stack : undefined,
      );

      this.channel.ack(message);
      return;
    }

    const retryCount = this.getRetryCount(message);

    this.logger.log(
      `Processing event: id=${event.id}, type=${event.type}, attempt=${retryCount + 1}`,
    );

    if (this.processedEventStore.has(event.id)) {
      this.logger.warn(
        `Duplicate event skipped: id=${event.id}, type=${event.type}`,
      );
      this.channel.ack(message);
      return;
    }

    try {
      await this.eventHandlerService.handle(event);
      this.processedEventStore.add(event.id);
      this.channel.ack(message);
      this.logger.log(`ACK sent for event: id=${event.id}, type=${event.type}`);
    } catch (error) {
      const retryLimit = this.configService.getOrThrow<number>(
        'consumer.rabbitmq.consumerRetryAttempts',
      );

      this.logger.error(
        `Failed to handle event: id=${event.id}, type=${event.type}. Message will be NACKed with requeue.`,
        error instanceof Error ? error.stack : undefined,
      );

      if (retryCount < retryLimit) {
        this.republishForRetry(message, retryCount);
        this.channel.ack(message);
        this.logger.warn(
          `Event republished for retry: id=${event.id}, type=${event.type}, attempt=${retryCount + 1}/${retryLimit}`,
        );

        return;
      }

      const reason =
        error instanceof Error ? error.message : 'Unknown processing error';

      this.publishToDlq(message, event, reason);

      this.channel.ack(message);
      this.logger.error(
        `Retry limit exceeded for event: id=${event.id}, type=${event.type}. Message will be ACKed.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
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
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      throw new Error(
        `Invalid JSON message: ${error instanceof Error ? error.message : 'Unknown JSON parse error'}`,
      );
    }

    if (!this.isEventDto(parsed)) {
      throw new Error('Invalid event message structure');
    }

    return parsed;
  }

  private getRetryCount(message: ConsumeMessage): number {
    const headers = message.properties.headers;

    if (!headers) {
      return 0;
    }

    const retryCount: unknown =
      message.properties.headers?.[this.retryCountHeader];

    if (typeof retryCount === 'number') {
      return retryCount;
    }

    if (typeof retryCount === 'string') {
      const parsedRetryCount = Number(retryCount);
      return Number.isNaN(parsedRetryCount) ? 0 : parsedRetryCount;
    }

    return 0;
  }

  private republishForRetry(message: ConsumeMessage, retryCount: number): void {
    const queue = this.configService.getOrThrow<string>(
      'consumer.rabbitmq.queue',
    );
    const nextRetryCount = retryCount + 1;
    const headers = message.properties.headers ?? {};
    const contentType: unknown = message.properties.contentType;

    this.channel.sendToQueue(queue, message.content, {
      contentType:
        typeof contentType === 'string' ? contentType : 'application/json',
      persistent: true,
      headers: {
        ...headers,
        [this.retryCountHeader]: nextRetryCount,
      },
    });
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
