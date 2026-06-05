import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { connect, Channel, ChannelModel } from 'amqplib';

import { ProducerModule } from '../../apps/producer/src/producer.module';
import { ConsumerModule } from '../../apps/consumer/src/consumer.module';
import { TelegramApiClient } from '@app/telegram-notifier';
import { EventType } from '@app/shared';
import { FakeTelegramApiClient } from './fake-telegram-api.client';

describe('Producer -> RabbitMQ -> Consumer -> Telegram Notifier (e2e)', () => {
  let producerApp: INestApplication;
  let consumerApp: INestApplication;

  let rabbitConnection: ChannelModel;
  let rabbitChannel: Channel;

  const fakeTelegramApiClient = new FakeTelegramApiClient();

  const queue = process.env.RABBITMQ_QUEUE ?? 'events.e2e.queue';
  const dlx = process.env.RABBITMQ_DLX_EXCHANGE ?? 'events.e2e.dlx';
  const dlq = process.env.RABBITMQ_DLQ ?? 'events.e2e.dlq';
  const rabbitmqUrl =
    process.env.RABBITMQ_URL ?? 'amqp://app_user:app_password@localhost:5672';

  beforeAll(async () => {
    rabbitConnection = await connect(rabbitmqUrl);
    rabbitChannel = await rabbitConnection.createChannel();

    await rabbitChannel.assertExchange(dlx, 'direct', { durable: true });
    await rabbitChannel.assertQueue(dlq, { durable: true });
    await rabbitChannel.bindQueue(dlq, dlx, dlq);
    await rabbitChannel.assertQueue(queue, { durable: true });

    await rabbitChannel.purgeQueue(queue);
    await rabbitChannel.purgeQueue(dlq);

    const consumerModule = await Test.createTestingModule({
      imports: [ConsumerModule],
    })
      .overrideProvider(TelegramApiClient)
      .useValue(fakeTelegramApiClient)
      .compile();

    consumerApp = consumerModule.createNestApplication();
    await consumerApp.init();

    const producerModule = await Test.createTestingModule({
      imports: [ProducerModule],
    }).compile();

    producerApp = producerModule.createNestApplication();
    await producerApp.init();
  });

  afterEach(async () => {
    fakeTelegramApiClient.clear();
    if (rabbitChannel) {
      await rabbitChannel.purgeQueue(queue);
      await rabbitChannel.purgeQueue(dlq);
    }
  });

  afterAll(async () => {
    await producerApp?.close();
    await consumerApp?.close();

    await rabbitChannel?.close();
    await rabbitConnection?.close();
  });

  it('publishes telegram event, consumes it, ACKs it, and sends telegram notification through fake client', async () => {
    await request(producerApp.getHttpServer() as Parameters<typeof request>[0])
      .post('/events')
      .send({
        type: EventType.TELEGRAM_NOTIFICATION_CREATED,
        payload: {
          title: 'E2E notification',
          message: 'Hello from e2e',
          metadata: {
            source: 'e2e-test',
          },
        },
      })
      .expect(201);

    await eventually(() => {
      expect(fakeTelegramApiClient.sentMessages).toHaveLength(1);
      expect(fakeTelegramApiClient.sentMessages[0]).toContain(
        'E2E notification',
      );
      expect(fakeTelegramApiClient.sentMessages[0]).toContain('Hello from e2e');
    });

    const queueState = await rabbitChannel.checkQueue(queue);

    const dlqState = await rabbitChannel.checkQueue(dlq);

    console.log('sentMessages', fakeTelegramApiClient.sentMessages);

    expect(queueState.messageCount).toBe(0);
    expect(dlqState.messageCount).toBe(0);
  });
});

async function eventually(
  assertion: () => void,
  timeoutMs = 5000,
): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw lastError;
}
