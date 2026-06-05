import { Logger } from '@nestjs/common';
import { EventDto, EventType } from '@app/shared';
import { NotificationService } from '@app/telegram-notifier';
import { EventHandlerService } from './event-handler.service';

describe('EventHandlerService', () => {
  let service: EventHandlerService;
  const notificationService = {
    sendNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventHandlerService(
      notificationService as unknown as NotificationService,
    );
  });

  function createEvent(
    type: EventType | string,
    payload: Record<string, unknown> = { message: 'Hello' },
  ): EventDto {
    return {
      id: 'event-id-1',
      type: type as EventType,
      payload,
      createdAt: '2026-06-04T00:00:00.000Z',
    };
  }

  it('handles SYSTEM_TEST_EVENT', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await service.handle(createEvent(EventType.SYSTEM_TEST_EVENT));

    expect(logSpy).toHaveBeenCalledWith(
      'System test event received: {"message":"Hello"}',
    );
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
  });

  it('handles TELEGRAM_NOTIFICATION_CREATED', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const payload = {
      title: 'Telegram title',
      message: 'Hello',
      metadata: {
        source: 'unit-test',
      },
    };

    await service.handle(
      createEvent(EventType.TELEGRAM_NOTIFICATION_CREATED, payload),
    );

    expect(notificationService.sendNotification).toHaveBeenCalledWith(payload);
    expect(logSpy).toHaveBeenCalledWith(
      'Telegram notification sent for event: id=event-id-1',
    );
  });

  it('throws when telegram notification payload is invalid', async () => {
    await expect(
      service.handle(createEvent(EventType.TELEGRAM_NOTIFICATION_CREATED)),
    ).rejects.toThrow('Invalid telegram notification payload');
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
  });

  it('propagates telegram notification errors', async () => {
    const error = new Error('Telegram API failed');

    notificationService.sendNotification.mockRejectedValue(error);

    await expect(
      service.handle(
        createEvent(EventType.TELEGRAM_NOTIFICATION_CREATED, {
          title: 'Telegram title',
          message: 'Hello',
          metadata: {},
        }),
      ),
    ).rejects.toThrow(error);
  });

  it('warns on unknown event type', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await service.handle(createEvent('unknown.event.type'));

    expect(warnSpy).toHaveBeenCalledWith('Unknown event type received:');
  });
});
