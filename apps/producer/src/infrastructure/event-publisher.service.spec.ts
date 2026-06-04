import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { ConfirmChannel, ChannelModel } from 'amqplib';
import { EventType } from '@app/shared';
import { EventPublishService } from './event-publisher.service';
import { EventSerializer } from './event.serializer';
import { Logger } from '@nestjs/common';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

const mockedConnect = jest.mocked(connect);

describe('EventPublishService', () => {
  let service: EventPublishService;

  const queue = 'events_queue';

  const mockChannel: jest.Mocked<
    Pick<
      ConfirmChannel,
      'assertQueue' | 'sendToQueue' | 'waitForConfirms' | 'close'
    >
  > = {
    assertQueue: jest.fn(),
    sendToQueue: jest.fn(),
    waitForConfirms: jest.fn(),
    close: jest.fn(),
  };

  const mockConnection = {
    createConfirmChannel: jest.fn(),
    close: jest.fn(),
  } as Partial<jest.Mocked<ChannelModel>> as jest.Mocked<ChannelModel>;

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, unknown> = {
        'producer.rabbitmq.url': 'amqp://localhost:5672',
        'producer.rabbitmq.queue': queue,
        'producer.rabbitmq.publishRetryAttempts': 3,
        'producer.rabbitmq.publishRetryDelayMs': 0,
      };

      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    jest.clearAllMocks();

    mockChannel.assertQueue.mockResolvedValue({
      queue,
      messageCount: 0,
      consumerCount: 0,
    });
    mockChannel.waitForConfirms.mockResolvedValue(undefined);
    mockChannel.close.mockResolvedValue(undefined);

    mockConnection.createConfirmChannel.mockResolvedValue(
      mockChannel as unknown as ConfirmChannel,
    );
    mockConnection.close.mockResolvedValue(undefined);

    mockedConnect.mockResolvedValue(mockConnection);

    service = new EventPublishService(
      configService as unknown as ConfigService,
      new EventSerializer(),
    );

    await service.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publishes event to RabbitMQ with JSON buffer and headers', async () => {
    const payload = { message: 'Hello from producer' };

    const event = await service.publish(EventType.SYSTEM_TEST_EVENT, payload);

    expect(event.id).toBe('00000000-0000-4000-8000-000000000000');
    expect(event.type).toBe(EventType.SYSTEM_TEST_EVENT);
    expect(event.payload).toEqual(payload);
    expect(event.createdAt).toEqual(expect.any(String));

    expect(connect).toHaveBeenCalledWith('amqp://localhost:5672');
    expect(mockConnection.createConfirmChannel.mock.calls).toHaveLength(1);
    expect(mockChannel.assertQueue).toHaveBeenCalledWith(queue, {
      durable: true,
    });

    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);

    const [actualQueue, actualBuffer, options] =
      mockChannel.sendToQueue.mock.calls[0];

    expect(actualQueue).toBe(queue);
    expect(Buffer.isBuffer(actualBuffer)).toBe(true);

    const parsedEvent = JSON.parse(
      actualBuffer.toString('utf-8'),
    ) as typeof event;

    expect(parsedEvent).toEqual(event);

    expect(options).toEqual({
      persistent: true,
      contentType: 'application/json',
      headers: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    expect(mockChannel.waitForConfirms).toHaveBeenCalledTimes(1);
  });

  it('retries publishing when confirm fails temporarily', async () => {
    mockChannel.waitForConfirms
      .mockRejectedValueOnce(new Error('Temporary RabbitMQ error'))
      .mockResolvedValueOnce(undefined);

    const event = await service.publish(EventType.SYSTEM_TEST_EVENT, {
      message: 'retry me',
    });

    expect(event.id).toEqual(expect.any(String));
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
    expect(mockChannel.waitForConfirms).toHaveBeenCalledTimes(2);
  });

  it('throws error after retry attempts are exhausted', async () => {
    const error = new Error('RabbitMQ is down');

    mockChannel.waitForConfirms.mockRejectedValue(error);

    await expect(
      service.publish(EventType.SYSTEM_TEST_EVENT, {
        message: 'fail me',
      }),
    ).rejects.toThrow('RabbitMQ is down');

    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
    expect(mockChannel.waitForConfirms).toHaveBeenCalledTimes(3);
  });
});
