import { EventType } from '@app/shared';
import { ProducerController } from './producer.controller';
import { EventPublishService } from '../infrastructure/event-publisher.service';

describe('ProducerController', () => {
  let controller: ProducerController;

  const eventPublisherService = {
    publish: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new ProducerController(
      eventPublisherService as unknown as EventPublishService,
    );
  });

  it('publishes event and returns event id with status', async () => {
    eventPublisherService.publish.mockResolvedValue({
      id: 'event-id-1',
      type: EventType.SYSTEM_TEST_EVENT,
      payload: { message: 'Hello from producer' },
      createdAt: '2026-06-04T00:00:00.000Z',
    });

    const result = await controller.publishEvent({
      type: EventType.SYSTEM_TEST_EVENT,
      payload: { message: 'Hello from producer' },
    });

    expect(eventPublisherService.publish).toHaveBeenCalledWith(
      EventType.SYSTEM_TEST_EVENT,
      { message: 'Hello from producer' },
    );

    expect(result).toEqual({
      eventId: 'event-id-1',
      status: 'published',
    });
  });
});
