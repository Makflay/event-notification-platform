import { ConfigService } from '@nestjs/config';
import { ConsumeMessage } from 'amqplib';
import { EventDto, EventType } from '@app/shared';
import { QueueListenerService } from './queue-listener.service';
import { EventHandlerService } from '../application/event-handler.service';
import { ProcessedEventsStore } from '../application/processed-events.store';

type QueueListenerServiceInternals = {
  handleMessage(message: ConsumeMessage | null): Promise<void>;
};

type PublishMock = jest.Mock<
  boolean,
  [
    exchange: string,
    routingKey: string,
    content: Buffer,
    options?: {
      contentType?: string;
      persistent?: boolean;
      headers?: Record<string, unknown>;
    },
  ]
>;

describe('QueueListenerService', () => {
  let service: QueueListenerServiceInternals;

  const mockChannel = {
    ack: jest.fn(),
    publish: jest.fn() as PublishMock,
    sendToQueue: jest.fn(),
  };

  const eventHandlerService = {
    handle: jest.fn(),
  };

  const processedEventsStore = {
    has: jest.fn(),
    add: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, unknown> = {
        'consumer.rabbitmq.queue': 'events_queue',
        'consumer.rabbitmq.dlxExchange': 'events.dlx',
        'consumer.rabbitmq.dlq': 'events.dlq',
        'consumer.rabbitmq.consumerRetryAttempts': 2,
      };

      return config[key];
    }),
  };

  function createEvent(overrides: Partial<EventDto> = {}): EventDto {
    return {
      id: 'event-id-1',
      type: EventType.SYSTEM_TEST_EVENT,
      payload: { message: 'Hello from RabbitMQ' },
      createdAt: '2026-06-04T00:00:00.000Z',
      ...overrides,
    };
  }

  function createMessage(
    event: EventDto,
    headers: Record<string, unknown> = {},
  ): ConsumeMessage {
    return {
      content: Buffer.from(JSON.stringify(event)),
      fields: {} as ConsumeMessage['fields'],
      properties: {
        headers,
        contentType: 'application/json',
      } as ConsumeMessage['properties'],
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();

    const queueListenerService = new QueueListenerService(
      configService as unknown as ConfigService,
      eventHandlerService as unknown as EventHandlerService,
      processedEventsStore as unknown as ProcessedEventsStore,
    );

    Reflect.set(queueListenerService, 'channel', mockChannel);
    service = queueListenerService as unknown as QueueListenerServiceInternals;
  });

  it('handles a new valid message and ACKs it', async () => {
    const event = createEvent();
    const message = createMessage(event);

    processedEventsStore.has.mockReturnValue(false);
    eventHandlerService.handle.mockResolvedValue(undefined);

    await service.handleMessage(message);

    expect(processedEventsStore.has).toHaveBeenCalledWith(event.id);
    expect(eventHandlerService.handle).toHaveBeenCalledWith(event);
    expect(processedEventsStore.add).toHaveBeenCalledWith(event.id);
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
    expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    expect(mockChannel.publish).not.toHaveBeenCalled();
  });

  it('skips duplicate message and ACKs it without handling', async () => {
    const event = createEvent();
    const message = createMessage(event);

    processedEventsStore.has.mockReturnValue(true);

    await service.handleMessage(message);

    expect(eventHandlerService.handle).not.toHaveBeenCalled();
    expect(processedEventsStore.add).not.toHaveBeenCalled();
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
  });

  it('republishes message for retry when handling fails before retry limit', async () => {
    const event = createEvent();
    const message = createMessage(event, { 'x-retry-count': 0 });
    const error = new Error('Temporary processing error');

    processedEventsStore.has.mockReturnValue(false);
    eventHandlerService.handle.mockRejectedValue(error);

    await service.handleMessage(message);

    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      'events_queue',
      message.content,
      {
        contentType: 'application/json',
        persistent: true,
        headers: {
          'x-retry-count': 1,
        },
      },
    );

    expect(mockChannel.ack).toHaveBeenCalledWith(message);
    expect(mockChannel.publish).not.toHaveBeenCalled();
    expect(processedEventsStore.add).not.toHaveBeenCalled();
  });

  it('sends message to DLQ after retry limit is exceeded', async () => {
    const event = createEvent();
    const message = createMessage(event, { 'x-retry-count': 2 });
    const error = new Error('Permanent processing error');

    processedEventsStore.has.mockReturnValue(false);
    eventHandlerService.handle.mockRejectedValue(error);

    await service.handleMessage(message);

    expect(mockChannel.publish).toHaveBeenCalledTimes(1);

    const [exchange, routingKey, content, options] =
      mockChannel.publish.mock.calls[0];

    expect(exchange).toBe('events.dlx');
    expect(routingKey).toBe('events.dlq');
    expect(content).toBe(message.content);
    expect(options?.contentType).toBe('application/json');
    expect(options?.persistent).toBe(true);

    expect(options?.headers?.eventId).toBe(event.id);
    expect(options?.headers?.eventType).toBe(event.type);
    expect(options?.headers?.deadLetterReason).toBe(
      'Permanent processing error',
    );
    expect(options?.headers?.['x-retry-count']).toBe(2);
    expect(typeof options?.headers?.deadLetteredAt).toBe('string');
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
    expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    expect(processedEventsStore.add).not.toHaveBeenCalled();
  });

  it('ACKs invalid JSON message without calling handler', async () => {
    const message = {
      content: Buffer.from('{invalid-json'),
      fields: {} as ConsumeMessage['fields'],
      properties: {
        headers: {},
        contentType: 'application/json',
      } as ConsumeMessage['properties'],
    };

    await service.handleMessage(message);

    expect(eventHandlerService.handle).not.toHaveBeenCalled();
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
  });
});
