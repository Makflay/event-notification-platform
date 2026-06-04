import { Logger } from '@nestjs/common';
import { EventDto, EventType } from '@app/shared';
import { EventHandlerService } from './event-handler.service';

describe('EventHandlerService', () => {
  let service: EventHandlerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventHandlerService();
  });

  function createEvent(type: EventType | string): EventDto {
    return {
      id: 'event-id-1',
      type: type as EventType,
      payload: { message: 'Hello' },
      createdAt: '2026-06-04T00:00:00.000Z',
    };
  }

  it('handles SYSTEM_TEST_EVENT', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    service.handle(createEvent(EventType.SYSTEM_TEST_EVENT));

    expect(logSpy).toHaveBeenCalledWith(
      'System test event received: {"message":"Hello"}',
    );
  });

  it('handles TELEGRAM_NOTIFICATION_CREATED', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    service.handle(createEvent(EventType.TELEGRAM_NOTIFICATION_CREATED));

    expect(logSpy).toHaveBeenCalledWith(
      'Telegram notification event received: id=event-id-1. It will be sent to Telegram later.',
    );
  });

  it('warns on unknown event type', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    service.handle(createEvent('unknown.event.type'));

    expect(warnSpy).toHaveBeenCalledWith('Unknown event type received:');
  });
});
